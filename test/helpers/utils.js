const BigNumber = require('bignumber.js');
const { ethers } = require('ethers');

function eth(num) {
  return ethers.utils.parseEther(num.toString());
}
function weiToEth(num) {
  return parseFloat(ethers.utils.formatEther(num.toString()));
}

function encodeData(contract, functionName, args) {
  const func = contract.interface.getFunction(functionName);
  return contract.interface.encodeFunctionData(func, args);
}

async function getBalances(provider, token, accounts) {
  const balances = {};
  for (let account of accounts) {
    const { name, address } = account;
    balances[name] = {};
    balances[name]['eth'] = new BigNumber(
      parseFloat(weiToEth(await provider.getBalance(address))),
    );
    let tokenBalance = 0;
    if (token && token.address != ethers.constants.AddressZero) {
      tokenBalance = weiToEth(await token.balanceOf(address));
    }
    balances[name]['tokens'] = new BigNumber(parseFloat(tokenBalance));
  }
  return balances;
}

function getTotalContributed(contributions) {
  let totalContributed = 0;
  contributions.map((contribution) => {
    totalContributed += contribution.amount;
  });
  return totalContributed;
}

async function approve(signer, tokenContract, to, tokenId) {
  const data = encodeData(tokenContract, 'approve', [to, tokenId]);
  return signer.sendTransaction({
    to: tokenContract.address,
    data,
  });
}

async function approveToken(signer, token, approveToken, contracts, to, amount) {

    let tokenContract;
    if(token == approveToken.BUSD){
        tokenContract = contracts.TokenBUSD;
    }
    if(token == approveToken.USDC){
        tokenContract = contracts.TokenUSDC;
    }
    if(token == approveToken.USDT){
        tokenContract = contracts.TokenUSDT;
    }

    if ((await tokenContract.allowance(signer.address, to)) < amount) {
      const data = encodeData(tokenContract, 'approve', [to, amount]);
      return signer.sendTransaction({
        to: tokenContract.address,
        data,
      });
    }
  }

async function sleep(ms = 0) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, ms);
    })
  };


module.exports = {
    eth,
    weiToEth,
    encodeData,
    getBalances,
    getTotalContributed,
    approve,
    approveToken,
    sleep
  };
  