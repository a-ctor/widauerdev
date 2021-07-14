// Adapted from https://stackoverflow.com/questions/18638900/javascript-crc32
class Crc32 {
    constructor(){ 
        let c;
        this.crcTable = [];
        for(let n =0; n < 256; n++){
            c = n;
            for(let k =0; k < 8; k++){
                c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            this.crcTable[n] = c;
        }
    }

    calculate(data) {
        const crcTable = this.crcTable;
        let crc = 0 ^ (-1);

        for (let i = 0; i < data.length; i++ ) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
        }

        return (crc ^ (-1)) >>> 0;
    }
}