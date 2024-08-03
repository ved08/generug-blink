import Fastify from "fastify";
import cors from '@fastify/cors'
import { ActionGetResponse, ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions"
import { TransactionInstruction,PublicKey, TransactionMessage, VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createNoopSigner, generateSigner, Instruction, percentAmount, publicKey, signerIdentity, TransactionBuilder } from "@metaplex-foundation/umi";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {toWeb3JsInstruction, toWeb3JsKeypair} from "@metaplex-foundation/umi-web3js-adapters"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

// Unused imports(code commented)
import path from "path";
import fs from "fs"
import puppeteer from "puppeteer"


const umi = createUmi('https://api.devnet.solana.com');


(
    async() => {

        const fastify = Fastify()
        await fastify.register(cors)

        fastify.get("/", async() => {
            const response: ActionGetResponse = {
                icon: `https://arweave.net/U8FW9J2Ik2SKbJOID6JIdv21hW8pqWLx-4VUie-gYig`,
                description: "lets ruggify rugged the new rug by minting a rug lol",
                label: "Rug it!",
                title: "Mint this Rug",
            } 
            return Response.json(response, {
                headers: ACTIONS_CORS_HEADERS
            })
        })

        fastify.options("/", async() => {
            const response: ActionGetResponse = {
                icon: `https://arweave.net/U8FW9J2Ik2SKbJOID6JIdv21hW8pqWLx-4VUie-gYig`,
                description: "lets ruggify rugged the new rug by minting a rug lol",
                label: "Rug it!",
                title: "Mint a Rug",
            } 
            return Response.json(response, {
                headers: ACTIONS_CORS_HEADERS
            })
        })

        fastify.post("/", async(req, res) => {

            // Initializing umi
            const umi = createUmi("https://api.devnet.solana.com")
            .use(mplCore())
            .use(mplTokenMetadata())
            .use(irysUploader())
            const body = await req.body as ActionPostRequest;
            let account: PublicKey;
            try {
                account = new PublicKey(body.account)
            } catch {
                throw "Invalid account"
            }
            
            const signer = createNoopSigner(publicKey(account))
            const mint = generateSigner(umi)

            umi.use(signerIdentity(signer))

            // Generate a rug using puppeteer
            // STILL TODO AS UPLOADER REQUIRES SIGNATURE BUT WE DONT HAVE SIGNATURE WITHOUT EXECUTING BLINK
            // const browser = await puppeteer.launch({headless: true})
            // const page = await browser.newPage()
            // await page.goto("https://deanmlittle.github.io/generug/")
            // await page.waitForSelector('canvas')
            // const canvas = await page.$('canvas')
            // if(canvas) {
            //     const imageBuffer = await canvas.screenshot({encoding: "binary"})
            //     // Create new rug.png
            //     fs.writeFileSync('rug.png', imageBuffer)
            // }

            // Upload image
            // const imageFile = fs.readFileSync(
            //     path.join(__dirname, "rug.png")
            // )
            // const umiImageFile = createGenericFile(imageFile, 'rug.png', {
            //     contentType: "image/png"
            // })
            // const imageUri = await umi.uploader.upload([umiImageFile]).catch(err => {throw new Error(err)})
            // console.log(`Image URL: ${imageUri[0]}`)

            // Upload Metadata
            // const metadata = {
            //     name: "Ancient Rug",
            //     symbol: "RUG",
            //     description: "An extremely rare ancient af rug minted using solana blink",
            //     image: imageUri[0],
            //     external_url: "https://x.com/ved08",
            //     attributes: [
            //         {
            //             "trait_type": "Discovered",
            //             "value": "69 BC"
            //         },
            //         {
            //             "trait_type": "Found By",
            //             "value": "ved08"
            //         }
            //     ]
            // }
            // const metadataUri = await umi.uploader.uploadJson(metadata).catch(err => {throw new Error(err)})
            const metadataUri = "https://arweave.net/9ypjRmkaxsa5kZdmz0vDH3WcASN_VYW7LYNEeIEEhS4"
            
            try {   

                const blockhash = (await umi.rpc.getLatestBlockhash()).blockhash

                // Create NFT transaction
                const createNftTransaction: TransactionBuilder = createNft(
                    umi,
                    {
                        mint,
                        name: `WBA Ancient Rug`,
                        symbol: "RUG",
                        sellerFeeBasisPoints: percentAmount(1.2),
                        uri: metadataUri,

                    }
                )
                createNftTransaction.setBlockhash(blockhash)
                

                // Instruction[] is from umi
                const mintNftIx: Instruction[] = createNftTransaction.getInstructions()
                // conver Intruction[] to TransactionInstruction[]
                const web3JsIx: TransactionInstruction[] = mintNftIx.map(ix => toWeb3JsInstruction(ix))

                // Create a Versioned Transaction:

                // First create a v0 message
                const v0message: VersionedMessage = new TransactionMessage({
                    payerKey: account,
                    recentBlockhash: blockhash,
                    instructions: web3JsIx
                }).compileToV0Message()
                // Make a versioned Transaction
                const transactionv0 = new VersionedTransaction(v0message)

                // Convert umi keypair to web3.js keypair
                const mintKeypair = toWeb3JsKeypair(mint)
                transactionv0.sign([mintKeypair])
              
                // Create Payload 
                const payload: ActionPostResponse = await createPostResponse({
                    fields: {
                        transaction: transactionv0,
                        message: "Successfully minted a rug"
                    }
                })

                return Response.json(payload, {
                    headers: ACTIONS_CORS_HEADERS
                })

            }catch(e) {
                console.log(e)
                return Response.json({
                    message: "Error"
                }, {
                    headers: ACTIONS_CORS_HEADERS
                })
            }
        })
        
        
        try {
            await fastify.listen({ port: 3000 })
        } catch (err) {
            fastify.log.error(err)
            process.exit(1)
        }
    }
)()