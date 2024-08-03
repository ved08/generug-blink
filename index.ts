import Fastify from "fastify";
import cors from '@fastify/cors'
import { ActionGetResponse, ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions"
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import path from "path";
import fs from "fs"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createNoopSigner, generateSigner, Instruction, percentAmount, publicKey, signerIdentity, TransactionBuilder, transactionBuilder } from "@metaplex-foundation/umi";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {toWeb3JsInstruction, toWeb3JsKeypair, toWeb3JsTransaction} from "@metaplex-foundation/umi-web3js-adapters"

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
            const connection = new Connection(clusterApiUrl("devnet"))
            const nftUmi = createUmi("https://api.devnet.solana.com")
            const mint = generateSigner(nftUmi)
            const umi = createUmi("https://api.devnet.solana.com")
            .use(mplCore())
            .use(mplTokenMetadata())
            try {   
                const body = await req.body as ActionPostRequest;
                let account: PublicKey;
                try {
                    account = new PublicKey(body.account)
                } catch {
                    throw "Invalid account"
                }

                const signer = createNoopSigner(publicKey(account))
                const nftSigner = generateSigner(umi)
                umi.use(signerIdentity(signer))
                // umi.use(signerIdentity(mint))

                const blockhash = (await connection.getLatestBlockhash()).blockhash
                
                const metadataUri = "https://arweave.net/9ypjRmkaxsa5kZdmz0vDH3WcASN_VYW7LYNEeIEEhS4"
                const createNftTransaction: TransactionBuilder = createNft(
                    umi,
                    {
                        mint,
                        name: `WBA Ancient Rug`,
                        sellerFeeBasisPoints: percentAmount(1.2),
                        uri: metadataUri
                        
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

                const mintKeypair = toWeb3JsKeypair(mint)
                transactionv0.sign([mintKeypair])
              
                
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