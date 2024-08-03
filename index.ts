import Fastify from "fastify";
import cors from '@fastify/cors'
import { ActionGetResponse, ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions"
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SystemInstruction, SystemProgram, Transaction } from "@solana/web3.js";
import path from "path";
import fs from "fs"

(
    async() => {

        const fastify = Fastify()
        await fastify.register(cors)
        
        fastify.get("/image", async(_, res) => {
            const imagePath = path.join(__dirname, 'rug.png')
            try {
                const imageStream = fs.createReadStream(imagePath);
                res.type('image/jpeg').send(imageStream);
              } catch (err) {
                res.status(500).send('Error reading image file');
              }
        })
        fastify.get("/", async() => {
            const response: ActionGetResponse = {
                icon: `https://picsum.photos/100`,
                description: "lets ruggify rugged the new rug by minting a rug lol",
                label: "Rug it!",
                title: "Mint a Rug",
            } 
            return Response.json(response, {
                headers: ACTIONS_CORS_HEADERS
            })
        })

        fastify.options("/", async() => {
            const response: ActionGetResponse = {
                icon: `https://picsum.photos/100`,
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
            try {   
                const body = await req.body as ActionPostRequest;
                let account: PublicKey;
                try {
                    account = new PublicKey(body.account)
                } catch {
                    throw "Invalid account"
                }

                const transaction = new Transaction()
                .add(SystemProgram.transfer({
                    fromPubkey: account,
                    toPubkey: new PublicKey("CztRNUjoAWDHpB1oNkGnQvry6SjAtoUR7hMSejDXV71i"),
                    lamports: 0.5 * LAMPORTS_PER_SOL
                }))
                const blockhash = (await connection.getLatestBlockhash()).blockhash
                transaction.feePayer = account
                transaction.recentBlockhash = blockhash
                const payload: ActionPostResponse = await createPostResponse({
                    fields: {
                        transaction,
                        message: "Let's rug whole world"
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