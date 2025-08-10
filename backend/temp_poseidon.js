
const circomlibjs = require('circomlibjs');

async function calculatePoseidon() {
    try {
        const poseidon = await circomlibjs.buildPoseidon();
        const inputs = [12345, 67890];
        const hash = poseidon(inputs);
        
        // Convert hash to proper format
        let hashStr;
        if (Array.isArray(hash)) {
            // Convert array to hex string, then to BigInt
            const hexStr = '0x' + hash.map(b => b.toString(16).padStart(2, '0')).join('');
            hashStr = BigInt(hexStr).toString();
        } else if (hash instanceof Uint8Array) {
            // Convert Uint8Array to hex string, then to BigInt
            const hexStr = '0x' + Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
            hashStr = BigInt(hexStr).toString();
        } else {
            // Already a BigInt or number
            hashStr = hash.toString();
        }
        console.log('HASH_RESULT:' + hashStr);
    } catch (error) {
        console.log('ERROR:' + error.message);
        console.log('ERROR_STACK:' + error.stack);
    }
}

calculatePoseidon().catch(error => {
    console.log('PROMISE_ERROR:' + error.message);
});
