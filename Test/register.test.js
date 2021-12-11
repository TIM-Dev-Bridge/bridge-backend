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

describe("Register", () => {
    describe("Valid Credentials", () => {
        test("not already exist : return 201", async () => {
            const response = await request(app).post("/register").send({
                first_name : "User",
                last_name : "Lastname",
                display_name : "User01",
                birth_date : "07-10-1999",
                email : "user@gmail.com",
                username : "User01",
                password : "Qq123456!",
                confirm_password : "Qq123456!"
            })
            expect(response.statusCode).toBe(201)
        })

        test("already exist : return 409", async () => {
            const response = await request(app).post("/register").send({
                first_name : "User",
                last_name : "Lastname",
                display_name : "User01",
                birth_date : "07-10-1999",
                email : "user@gmail.com",
                username : "User01",
                password : "Qq123456!",
                confirm_password : "Qq123456!"
            })
            expect(response.statusCode).toBe(409)
        })

        test("already exist : return error : User already exist. Please login", async () => {
            const response = await request(app).post("/register").send({
                first_name : "User",
                last_name : "Lastname",
                display_name : "User01",
                birth_date : "07-10-1999",
                email : "user@gmail.com",
                username : "User01",
                password : "Qq123456!",
                confirm_password : "Qq123456!"
            })
            expect(response.text).toBe("User already exist. Please login")
        })
    })

    describe("Invalid Credentials", () => {
        describe("Invalid Firstname", () => {
            describe("No Firstname", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({   
                        first_name : "",                                                       //No Firstname
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : All input is required", async () => {
                    const response = await request(app).post("/register").send({   
                        first_name : "",                                                       //No Firstname
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.required).toBe("All input is required")
                })
            })
    
            describe("Special Character Firstname", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Special Character Firstname
                        first_name : "☺☻♥♦♣♠",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : Firstname only accept alphabet", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Special Character Firstname
                        first_name : "☺☻♥♦♣♠",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.first_name).toBe("Firstname only accept alphabet")
                })
            })
    
            describe("Numeric Firstname", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Numeric Firstname
                        first_name : "123456",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : Firstname only accept alphabet", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Numeric Firstname
                        first_name : "123456",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.first_name).toBe("Firstname only accept alphabet")
                })
            })
        })
        
        describe("Invalid Lastname", () => {
            describe("Empty Lastname", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Empty Lastname
                        first_name : "Firstname",
                        last_name : "",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : All input is required", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Empty Lastname
                        first_name : "Firstname",
                        last_name : "",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.required).toBe("All input is required")
                })
            })
    
            describe("Special Character Lastname", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Special Character Lastname
                        first_name : "Firstname",
                        last_name : "☺☻♥♦♣♠",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : Lastname only accept alphabet", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Special Character Lastname
                        first_name : "Firstname",
                        last_name : "☺☻♥♦♣♠",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.last_name).toBe("Lastname only accept alphabet")
                })
            })
    
            describe("Numeric Lastname", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Numeric Lastname
                        first_name : "Firstname",
                        last_name : "123456",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : Lastname only accept alphabet", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Numeric Lastname
                        first_name : "Firstname",
                        last_name : "123456",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.last_name).toBe("Lastname only accept alphabet")
                })
            })
        })
        
        describe("Invalid Email", () => {
            describe("Empty Email", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Empty email
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : All input is required", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Empty email
                        first_name : "Firstname",
                        last_name : "lastname",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.required).toBe("All input is required")
                })
            })
    
            describe("Invalid email format", () => {
                describe("no @", () => {
                    test("Respond with 400", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Invalid Email (No @)
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "usergmail.com",
                            username : "User01",
                            password : "Qq123456!",
                            confirm_password : "Qq123456!"
                        })
                        expect(response.statusCode).toBe(400)
                    })
                    
                    test("return error cause : Invalid email format", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Invalid Email (No @)
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "usergmail.com",
                            username : "User01",
                            password : "Qq123456!",
                            confirm_password : "Qq123456!"
                        })
                        expect(response.body.email).toBe("Invalid email format")
                    })
                })
                
                describe("no dot", () => {
                    test("Respond with 400", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Invalid Email (No dot)
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "user@gmailcom",
                            username : "User01",
                            password : "Qq123456!",
                            confirm_password : "Qq123456!"
                        })
                        expect(response.statusCode).toBe(400)
                    })
                    
                    test("return error cause : Invalid email format", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Invalid Email (No dot)
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "user@gmailcom",
                            username : "User01",
                            password : "Qq123456!",
                            confirm_password : "Qq123456!"
                        })
                        expect(response.body.email).toBe("Invalid email format")
                    })
                })
    
                describe("no @ and no dot", () => {
                    test("Respond with 400", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Invalid Email (No @ and No dot)
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "usergmailcom",
                            username : "User01",
                            password : "Qq123456!",
                            confirm_password : "Qq123456!"
                        })
                        expect(response.statusCode).toBe(400)
                    })
                    
                    test("return error cause : Invalid email format", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Invalid Email (No @ and No dot)
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "usergmailcom",
                            username : "User01",
                            password : "Qq123456!",
                            confirm_password : "Qq123456!"
                        })
                        expect(response.body.email).toBe("Invalid email format")
                    })
                })
            })
        })
        
        describe("Invalid Display Name", () => {
            describe("Empty Display Name", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Empty Display Name
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : All input is required", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Empty Display Name
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.required).toBe("All input is required")
                })
            })
            
            describe("too Short Display Name", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //too Short Display Name
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "User",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : Length of displayname should between 5 and 16", async () => {
                    const response = await request(app).post("/register").send({                                                                               //too Short Display Name
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "User",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.display_name).toBe("Length of displayname should between 5 and 16")
                })
            })
    
            describe("too Long Display Name", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //too Long Display Name
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "UserAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : Length of displayname should between 5 and 16", async () => {
                    const response = await request(app).post("/register").send({                                                                               //too Long Display Name
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "UserAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.display_name).toBe("Length of displayname should between 5 and 16")
                })
            })
        })
        
        describe("Invalid Birth Date", () => {
            describe("Empty Birth Date", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //empty Birth Date
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : All input is required", async () => {
                    const response = await request(app).post("/register").send({                                                                               //empty Birth Date
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.required).toBe("All input is required")
                })
            })

            describe("Age should not over 100 years old", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Age should not over 100 years old
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-1920",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : Age should not over 100 years old", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Age should not over 100 years old
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-1920",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.birth_date).toBe("Age should be under 100 years old")
                })
            })

            describe("Age should be above 12 years old", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Age should be above 12 years old
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-2010",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : Age should not over 100 years", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Age should be above 12 years old
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-2010",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "Qq123456!",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.birth_date).toBe("Age should be above 12 years old")
                })
            })
        })
        
        describe("Invalid Password", () => {
            describe("Empty Password", () => {
                test("Respond with 400", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Empty Password
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.statusCode).toBe(400)
                })
                
                test("return error cause : All input is required", async () => {
                    const response = await request(app).post("/register").send({                                                                               //Empty Password
                        first_name : "Firstname",
                        last_name : "Lastname",
                        display_name : "User01",
                        birth_date : "07-10-1999",
                        email : "user@gmail.com",
                        username : "User01",
                        password : "",
                        confirm_password : "Qq123456!"
                    })
                    expect(response.body.required).toBe("All input is required")
                })
            })

            describe("Invalid Password Restriction", () => {
                describe("Password too easy to guest", () => {
                    test("Respond with 400", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Password too easy to guest
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "user@gmail.com",
                            username : "User01",
                            password : "aaaaaaaaaaa",
                            confirm_password : "aaaaaaaaaaa"
                        })
                        expect(response.statusCode).toBe(400)
                    })
                    
                    test("return error cause : Password should include Capital Letter, small Letter, number and special character", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Password too easy to guest
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "user@gmail.com",
                            username : "User01",
                            password : "aaaaaaaaaaa",
                            confirm_password : "aaaaaaaaaaa"
                        })
                        expect(response.body.format_password).toBe("Password should include Capital Letter, small Letter, number and special character")
                    })
                })
                
                describe("Password too short", () => {
                    test("Respond with 400", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Password too short
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "user@gmail.com",
                            username : "User01",
                            password : "Qq123!",
                            confirm_password : "Qq123!"
                        })
                        expect(response.statusCode).toBe(400)
                    })
                    
                    test("return error cause : Password should contain at least 8 characters", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Password too short
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "user@gmail.com",
                            username : "User01",
                            password : "Qq123!",
                            confirm_password : "Qq123!"
                        })
                        expect(response.body.short_password).toBe("Password should contain at least 8 characters")
                    })
                })

                describe("Password too long", () => {
                    test("Respond with 400", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Password too long
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "user@gmail.com",
                            username : "User01",
                            password : "Qq123AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA!",
                            confirm_password : "Qq123AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA!"
                        })
                        expect(response.statusCode).toBe(400)
                    })
                    
                    test("return error cause : Password should contain at least 8 characters", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Password too long
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "user@gmail.com",
                            username : "User01",
                            password : "Qq123AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA!",
                            confirm_password : "Qq123AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA!"
                        })
                        expect(response.body.short_password).toBe("Password should contain less than 32 character")
                    })
                })
                
                describe("Password do not match with Confirm Password", () => {
                    test("Respond with 400", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Password do not match with Confirm Password
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "user@gmail.com",
                            username : "User01",
                            password : "Qq123456!",
                            confirm_password : "Qq123456"
                        })
                        expect(response.statusCode).toBe(400)
                    })
                    
                    test("return error cause : Password do not match", async () => {
                        const response = await request(app).post("/register").send({                                                                               //Password do not match with Confirm Password
                            first_name : "Firstname",
                            last_name : "Lastname",
                            display_name : "User01",
                            birth_date : "07-10-1999",
                            email : "user@gmail.com",
                            username : "User01",
                            password : "Qq123456!",
                            confirm_password : "Qq123456"
                        })
                        expect(response.body.confirm_password).toBe("Password do not match")
                    })
                })
            })
        })
    })
})