const request = require("supertest");
const app = require("../app.js");

describe("Login",() => {

    describe("Check Login with valid Credentials",() =>{
        test("Respond with 200", async () => {
            const response = await request(app).post("/login").send({
                email: "user@gmail.com",
                password: "Qq123456!"
            })
            expect(response.statusCode).toBe(200)
        })
        test("return user json", async () => {
            const response = await request(app).post("/login").send({
                email: "user@gmail.com",
                password: "Qq123456!"
            })
            expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
        })
        
        test("return user_id", async () => {
            const response = await request(app).post("/login").send({
                email: "user@gmail.com",
                password: "Qq123456!"
            })
            expect(response.body.username).toBeDefined()
        })
    })
    
    describe("Check Login with Invalid Credentials",() =>{
        
        describe("only email input",()=>{
            test("return 400", async () => {
                const response = await request(app).post("/login").send({
                    "email":"user@gmail.com",
                    "password":""
                })
                expect(response.statusCode).toBe(400)
            })
    
            test("return error cause", async () => {
                const response = await request(app).post("/login").send({
                    "email":"user@gmail.com",
                    "password":""
                })
                expect(response.body.password).toBe("Must not be empty")
            })
        })

        // describe("only password input", ()=>{
        //     test("return 400", async () => {
        //         const response = await request(app).post("/login").send({
        //             password:"Qq123456!"
        //         })
        //         expect(response.statusCode).toBe(400)
        //     })
    
        //     test("return error cause", async () => {
        //         const response = await request(app).post("/login").send({
        //             password:"Qq123456!"
        //         })
        //         expect(response.body.errors.email).toBe("Must not be empty")
        //     })
        // })

    //     describe("Invalid email format", () => {
            
    //     })

    //     test("Check Login with Invalid Credentials : Respond with 400", async () => {
    //         const bodyData = [
    //             {email:"user@gmail.com"},                                                       //only email
    //             {password:"Qq123456!"},                                                         //only password
    //             {},                                                                             
    //             {                                                                               //invalid email format (no @)
    //                 email: "usergmail.com",
    //                 password: "Qq123456!"
    //             },                                                      
    //             {                                                                               //invalid email format (no dot)
    //                 email: "user@gmailcom",
    //                 password: "Qq123456!"
    //             },                                                      
    //             {                                                                               //invalid email format (no @ and dot)
    //                 email: "usergmailcom",
    //                 password: "Qq123456!"
    //             },                                                      
    //             {                                                                               //invalid password restriction
    //                 email: "user@gmail.com",
    //                 password: "aaaaaaaaaaa"
    //             },                                                      
    //             {                                                                               //too short password
    //                 email: "user@gmail.com",
    //                 password: "Qq123!"
    //             },                                                      
    //             {                                                                               //too long password
    //                 email: "user@gmail.com",
    //                 password: "Qq123456!aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"
    //             },
    //         ]
    //         for (const body of bodyData){
    //             const response = await request(app).post("/login").send(body)
    //             expect(response.statusCode).toBe(400)
    //         }
    //     })
        
     })
}) 
