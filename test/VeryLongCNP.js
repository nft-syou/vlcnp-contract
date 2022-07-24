const { deployContract } = require('./helper.js');
const { expect } = require('chai');
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs')
const keccak256 = require("keccak256");

const createTestSuite = ({ contract, constructorArgs }) =>
  function () {
    context(`${contract}`, function () {
      beforeEach(async function () {
        this.erc721a = await deployContract(contract, constructorArgs);
        this.startTokenId = 1;
      });

      context('with no minted tokens', async function () {
        it('has 0 totalSupply', async function () {
          const supply = await this.erc721a.totalSupply();
          expect(supply).to.equal(0);
        });

        it('has 11111 maxSupply', async function () {
          const maxSupply = await this.erc721a.maxSupply();
          expect(maxSupply).to.equal(11111);
        });

        it('has 0.001 ether publicCost', async function () {
          const publicCost = await this.erc721a.publicCost();
          expect(publicCost).to.equal(ethers.utils.parseEther("0.001"));
        });

        it('has 0.001 ether preCost', async function () {
          const preCost = await this.erc721a.preCost();
          expect(preCost).to.equal(ethers.utils.parseEther("0.001"));
        });

        it('has BeforeMint phase', async function () {
          const phase = await this.erc721a.phase();
          expect(phase).to.equal(0);
        });

        it('has publicMaxPerTx 10', async function () {
          const publicMaxPerTx = await this.erc721a.publicMaxPerTx();
          expect(publicMaxPerTx).to.equal(10);
        });

        it('throws an exception for mint', async function () {
          await expect(this.erc721a['mint(uint256)'](1)).to.be.revertedWith('Public mint is not active.');
        });
      });
      context('with whitelistMint minted tokens', async function () {
        beforeEach(async function () {
          const [owner, addr1, addr2, addr3] = await ethers.getSigners();
          this.owner = owner;
          this.addr1 = addr1;
          this.addr2 = addr2;
          this.addr3 = addr3;
          this.leavesSettings = [
            {
              sign: this.owner,
              address: this.owner.address,
              presaleMax: 5
            },
            {
              sign: this.addr1,
              address: this.addr1.address,
              presaleMax: 5
            },
            {
              sign: this.addr2,
              address: this.addr2.address,
              presaleMax: 5
            },
          ]
          this.proofSettings = [
            {
              sign: this.owner,
              address: this.owner.address,
              presaleMax: 5
            },
            {
              sign: this.addr1,
              address: this.addr1.address,
              presaleMax: 5
            },
            {
              sign: this.addr2,
              address: this.addr2.address,
              presaleMax: 5
            },
          ]
          await this.erc721a['setPhase(uint8)'](1);
          const leaves = this.leavesSettings.map(
            x => ethers.utils.solidityKeccak256(['address', 'uint256'], [x.address, x.presaleMax])
          );
          const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
          this.rootTree = tree.getRoot();
          await this.erc721a['setMerkleRoot(bytes32)'](this.rootTree);
          this.hexProofs = this.proofSettings.map((x) =>
            tree.getHexProof(ethers.utils.solidityKeccak256(['address', 'uint256'], [x.address, x.presaleMax]))
          );

          await this.erc721a.connect(this.proofSettings[0].sign).preMint(
            1,
            this.proofSettings[0].presaleMax,
            this.hexProofs[0],
            { value: ethers.utils.parseEther("0.001") }
          )
          await this.erc721a.connect(this.proofSettings[2].sign).preMint(
            1,
            this.proofSettings[2].presaleMax,
            this.hexProofs[2],
            { value: ethers.utils.parseEther("0.001") }
          )
        });

        describe('balanceOf', async function () {
          it('ownner: returns the amount for a given address', async function () {
            expect(await this.erc721a.balanceOf(this.owner.address)).to.equal('1');
          });

          it('address2: returns the amount for a given address', async function () {
            expect(await this.erc721a.balanceOf(this.addr2.address)).to.equal('1');
          })
        });

        describe('whitelistMinted', async function () {
          it('ownner: returns the amount for a given address', async function () {
            expect(await this.erc721a.whitelistMinted(this.owner.address)).to.equal('1');
          });

          it('address2: returns the amount for a given address', async function () {
            expect(await this.erc721a.whitelistMinted(this.addr2.address)).to.equal('1');
          })
        });
        describe('whitelistMint', async function () {
          it('throws an exception for Address already claimed max amount', async function () {
            await expect(
              this.erc721a.connect(this.proofSettings[0].sign).preMint(
                5,
                this.proofSettings[0].presaleMax,
                this.hexProofs[0],
                { value: ethers.utils.parseEther("0.005") }
              )
            ).to.be.revertedWith('Address already claimed max amount');
          });
          it('throws an exception for Not enough funds provided for mint', async function () {
            await expect(
              this.erc721a.connect(this.proofSettings[0].sign).preMint(
                1,
                this.proofSettings[0].presaleMax,
                this.hexProofs[0]
              )
            ).to.be.revertedWith('Not enough funds provided for mint');
          });
          it('throws an exception for Total supply cannot exceed maxSupply', async function () {
            await expect(
              this.erc721a.connect(this.proofSettings[0].sign).preMint(
                11112,
                this.proofSettings[0].presaleMax,
                this.hexProofs[0]
              )
            ).to.be.revertedWith('Total supply cannot exceed maxSupply');
          });
          it('throws an exception for Invalid Merkle Proof', async function () {
            this.leavesSettings = [
              {
                sign: this.owner,
                address: this.owner.address,
                presaleMax: 5
              },
              {
                sign: this.addr1,
                address: this.addr1.address,
                presaleMax: 5
              },
              {
                sign: this.addr2,
                address: this.addr2.address,
                presaleMax: 5
              },
            ]
            this.proofSettings = [
              {
                sign: this.owner,
                address: this.owner.address,
                presaleMax: 10
              },
              {
                sign: this.addr1,
                address: this.addr1.address,
                presaleMax: 10
              },
              {
                sign: this.addr2,
                address: this.addr2.address,
                presaleMax: 10
              },
            ]
            await this.erc721a['setPhase(uint8)'](1);
            const leaves = this.leavesSettings.map(
              x => ethers.utils.solidityKeccak256(['address', 'uint256'], [x.address, x.presaleMax])
            );
            const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
            this.rootTree = tree.getRoot();

            await expect(
              this.erc721a.connect(this.proofSettings[0].sign).preMint(
                1,
                this.proofSettings[0].presaleMax,
                this.hexProofs[0],
                { value: ethers.utils.parseEther("0.001") }
              )
            ).to.be.revertedWith('Invalid Merkle Proof');
          })
        });
      });
      context('with mint minted tokens', async function () {
        beforeEach(async function () {
          const [owner, addr1, addr2, addr3] = await ethers.getSigners();
          this.owner = owner;
          this.addr1 = addr1;
          this.addr2 = addr2;
          this.addr3 = addr3;
          await this.erc721a['setPhase(uint8)'](2);
          await this.erc721a['mint(uint256)'](1, { value: ethers.utils.parseEther("0.001") });
          await this.erc721a.connect(this.addr2)['mint(uint256)'](
            3,
            { value: ethers.utils.parseEther("0.003") }
          );
        });

        describe('balanceOf', async function () {
          it('ownner: returns the amount for a given address', async function () {
            expect(await this.erc721a.balanceOf(this.owner.address)).to.equal('1');
          });

          it('address2: returns the amount for a given address', async function () {
            expect(await this.erc721a.balanceOf(this.addr2.address)).to.equal('3');
          })
        });

        describe('mint', async function () {
          it('throws an exception for Not enough funds provided for mint', async function () {
            await expect(
              this.erc721a.connect(this.addr1)['mint(uint256)'](
                1
              )).to.be.revertedWith('Not enough funds provided for mint');
          });
          it('throws an exception for Mint amount cannot exceed 10 per Tx.', async function () {
            await expect(
              this.erc721a.connect(this.addr2)['mint(uint256)'](
                11,
                { value: ethers.utils.parseEther("0.011") }
              )).to.be.revertedWith('Mint amount cannot exceed 10 per Tx.');
          });
          it('throws an exception for Total supply cannot exceed maxSupply', async function () {
            await expect(
              this.erc721a.connect(this.addr2)['mint(uint256)'](
                100000
              )).to.be.revertedWith('Total supply cannot exceed maxSupply');
          });
        });
      });
    });
  };

describe('VeryLongCNP', createTestSuite({ contract: 'VeryLongCNP'}));