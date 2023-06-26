// Each curve has similar methods
const { secp256k1 } =  require('@noble/curves/secp256k1');
// import { secp256k1 } from 'npm:@noble/curves@1.2.0/secp256k1'; // Deno
const priv = new Uint8Array([
    147, 146, 165,  12,  47,  69,   7,
    101, 133, 107, 108, 217, 124,  40,
    188, 158, 192,  51, 159, 124,  46,
    224, 151, 222,  64, 199, 221, 193,
    105, 255,  25, 194
  ])

  const pub = new Uint8Array([
    3, 220, 176,  74, 186, 168, 174, 173,
    46, 174, 204, 159, 206, 132, 254,  84,
    30, 149,   2, 162, 226,  29,  54, 178,
    72, 223,  78, 159,  78,  37,  60, 216,
    167
  ])

const msg = "pera"
hexMsg = Buffer.from(msg).toString('hex')

console.log(hexMsg)
sig = secp256k1.sign(hexMsg, priv);

// sigSerialized = JSON.stringify(sig, (key, value) =>
// typeof value === 'bigint'
//     ? value.toString()
//     : value // return everything else unchanged
// )

// hexSigSerialized = Buffer.from(sigSerialized).toString('hex')
 
sig = sig.toCompactHex()

// console.log(msg.constructor.name)
// console.log(sig.constructor.name)

msg2 = '504f53542f636172747b22757365724964223a2231222c2270726f647563744964223a2261616176222c227175616e74697479223a2232227d'
sig2 = '7b2272223a223834383136363434343332383238313537373435323434373535383938373935353839373033363131323838373433313630393239393735323430323131373431303634393533333336373939222c2273223a223134303530303238353931393131383131363833313533323231393538343832363534343735383933373236393638303331313233383436343536313038393336373037323539383537383634222c227265636f76657279223a317d'



const isValid = secp256k1.verify(sig, hexMsg, pub) === true;

console.log(isValid)