const HttpsProxyAgent = require('https-proxy-agent')
const axiosDefaultConfig = {
    proxy: false,
    httpsAgent: new HttpsProxyAgent("http://127.0.0.1:19180")
};
var axios = require('axios').create(axiosDefaultConfig);


function formatIpfsUrl(url){
    return url.replace("ipfs://", "https://ipfs.io/ipfs/")
}

async function getMetaData(url){
    try {
        url = formatIpfsUrl(url);
        const res = await axios.get(url, { timeout: 300000 });
        // console.log(url + '--->' + res.status)
        return res.data;

    } catch (error) {
        console.log(url + "===>>" + error.message)
    }
    return null;
}

module.exports = {
    formatIpfsUrl,
    getMetaData
}