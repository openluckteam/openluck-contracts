// const { LZ_ADDRESS } = require("@layerzerolabs/core-sdk")
const LZ_ADDRESS = require("../constants/lzAddress.json")

function getLayerZeroAddress(networkName) {
    if(!Object.keys(LZ_ADDRESS).includes(networkName)){
        throw new Error("Unknown networkName: " + networkName);
    }
    console.log(`networkName[${networkName}]`)
    return LZ_ADDRESS[networkName];
}

module.exports = {
    getLayerZeroAddress
}