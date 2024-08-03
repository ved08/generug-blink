import { createGenericFile, createSignerFromKeypair, generateSigner, SolAmount, signerIdentity } from "@metaplex-foundation/umi"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import fs from "fs"
import path from "path"
import wallet from "./wallet"

const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));


(async() => {
    const imageFile = fs.readFileSync(
        path.join(__dirname, "rug.png")
    )
    const umiImageFile = createGenericFile(imageFile, 'rug.png', {
        contentType: "image/png"
    })
    
    const imageUri = await umi.uploader.upload([umiImageFile]).catch(err => {throw new Error(err)})

    console.log(`Image URL: ${imageUri[0]}`)
})()