const request = require("supertest");
const app = require("../app.js");
const mongoose = require("mongoose");

beforeAll(done => {
    done()
  })

afterAll(done => {
    mongoose.connection.close()
    done()
})

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
        
        test("return user_name", async () => {
            const response = await request(app).post("/login").send({
                email: "user@gmail.com",
                password: "Qq123456!"
            })
            expect(response.body.username).toBeDefined()
        })

        test("user not exist : return error Invalid Credentials", async () => {
            const response = await request(app).post("/login").send({
                email: "user10@gmail.com",
                password: "Qq123456!"
            })
            expect(response.text).toBe("Invalid Credentials")
        })

        test("wrong password : return error Invalid Credentials", async () => {
            const response = await request(app).post("/login").send({
                email: "user10@gmail.com",
                password: "Qq123456"
            })
            expect(response.text).toBe("Invalid Credentials")
        })

    })
    
    describe("Check Login with Invalid Credentials",() =>{

        describe("only email input",()=>{
            test("return 400", async () => {
                const response = await request(app).post("/login").send({
                    email:"user@gmail.com",
                    password:""
                })
                expect(response.statusCode).toBe(400)
            })
    
            test("return error cause : Password Must not be empty", async () => {
                const response = await request(app).post("/login").send({
                    email:"user@gmail.com",
                    password:""
                })
                expect(response.body.password).toBe("Must not be empty")
            })
        })

        describe("only password input", ()=>{
            test("return 400", async () => {
                const response = await request(app).post("/login").send({
                    email : "",
                    password:"Qq123456!"
                })
                expect(response.statusCode).toBe(400)
            })
    
            test("return error cause : Email Must not be empty: ", async () => {
                const response = await request(app).post("/login").send({
                    email : "",
                    password:"Qq123456!"
                })
                expect(response.body.email).toBe("Must not be empty")
            })
        })

        describe("Invalid email format", () => {
            describe("no @", () =>{
                test("return 400", async () => {
                    const response = await request(app).post("/login").send({
                        email : "usergmail.com",
                        password:"Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })

                test("return error cause : Invalid email format", async () => {
                    const response = await request(app).post("/login").send({
                        email : "usergmail.com",
                        password:"Qq123456!"
                    })
                    expect(response.body.format_email).toBe("Invalid email format")
                })
            })

            describe("no dot", () =>{
                test("return 400", async () => {
                    const response = await request(app).post("/login").send({
                        email : "user@gmailcom",
                        password:"Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })

                test("return error cause : Invalid email format", async () => {
                    const response = await request(app).post("/login").send({
                        email : "user@gmailcom",
                        password:"Qq123456!"
                    })
                    expect(response.body.format_email).toBe("Invalid email format")
                })
            })
            
            describe("no @ and no dot", () =>{
                test("return 400", async () => {
                    const response = await request(app).post("/login").send({
                        email : "usergmailcom",
                        password:"Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })

                test("return error cause : Invalid email format", async () => {
                    const response = await request(app).post("/login").send({
                        email : "usergmailcom",
                        password:"Qq123456!"
                    })
                    expect(response.body.format_email).toBe("Invalid email format")
                })
            })
        })

        describe("Invalid password format", () => {
            describe("Too easy to guest", () =>{
                test("return 400", async () => {
                    const response = await request(app).post("/login").send({
                        email : "user@gmail.com",
                        password:"aaaaaaaaaaa"
                    })
                    expect(response.statusCode).toBe(400)
                })

                test("return error cause : Invalid Password", async () => {
                    const response = await request(app).post("/login").send({
                        email : "user@gmail.com",
                        password:"aaaaaaaaaaa"
                    })
                    expect(response.body.format_password).toBe("Invalid Password")
                })
            })

            describe("too short", () =>{
                test("return 400", async () => {
                    const response = await request(app).post("/login").send({
                        email : "user@gmail.com",
                        password:"Qq123!"
                    })
                    expect(response.statusCode).toBe(400)
                })

                test("return error cause : Invalid Password", async () => {
                    const response = await request(app).post("/login").send({
                        email : "user@gmail.com",
                        password:"Qq123!"
                    })
                    expect(response.body.format_password).toBe("Invalid Password")
                })
            })
            
            describe("too long", () =>{
                test("return 400", async () => {
                    const response = await request(app).post("/login").send({
                        email : "user@gmail.com",
                        password:"Qq123456!aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"
                    })
                    expect(response.statusCode).toBe(400)
                })

                test("return error cause : Invalid Password", async () => {
                    const response = await request(app).post("/login").send({
                        email : "user@gmail.com",
                        password:"Qq123456!aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"
                    })
                    expect(response.body.format_password).toBe("Invalid Password")
                })
            })
        })
    })
}) 




            
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