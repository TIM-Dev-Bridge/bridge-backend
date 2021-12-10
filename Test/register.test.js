/*const request = require("supertest");
const app = require("../app");

describe("Register",() => {
    describe("Valid register",() => {
        test("Check Register with valid infomation : return 200", async () => {
            const response = await request(app).post("/register").send({
                first_name : "User",
                last_name : "Lastname",
                display_name : "User01",
                birth_date : "07-10-2012",
                email : "user@gmail.com",
                username : "User01",
                password : "Qq123456!",
                confirm_password : "Qq123456!"
            })
            expect(response.statusCode).toBe(200)
        })
        test("Check Register with valid infomation : return user json", async () => {
            const response = await request(app).post("/register").send({
                first_name : "User",
                last_name : "Lastname",
                display_name : "User01",
                birth_date : "07-10-2012",
                email : "user@gmail.com",
                username : "User01",
                password : "Qq123456!",
                confirm_password : "Qq123456!"
            })
            expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
        })
        test("Check Register with valid infomation : return user_id", async () => {
            const response = await request(app).post("/register").send({
                first_name : "User",
                last_name : "Lastname",
                display_name : "User01",
                birth_date : "07-10-2012",
                email : "user@gmail.com",
                username : "User01",
                password : "Qq123456!",
                confirm_password : "Qq123456!"
            })
            expect(response.body.error).toBeDefined()
        })
    })

    describe("Invalid Register",() =>{
        test("Check Register with Invalid Credentials : Respond with 400", async () => {
            const bodyData = [
                {                                                                               //No Firstname
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //Special Character Firstname
                    first_name : "☺☻♥♦♣♠",
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //Numeric Firstname
                    first_name : "12346",
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //Empty Lastname
                    first_name : "Firstname",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //Special Character Lastname
                    first_name : "Firstname",
                    last_name : "☺☻♥♦♣♠",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //Numeric Lastname
                    first_name : "Firstname",
                    last_name : "123456",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //Empty email
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //Invalid email format (no @)
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "usergmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //Invalid email format (no dot)
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "user@gmailcom",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //Invalid email format (no @ and no dot)
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "usergmailcom",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //Empty Display Name
                    first_name : "Firstname",
                    last_name : "Lastname",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //too Short Display Name
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "User",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //too Long Display Name
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "UserAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //empty Birth Date
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "User01",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //too old birthdate (100 years)
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "1920-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //future birthdate
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "2112-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123456!"
                },
                {                                                                               //empty password
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                },
                {                                                                               //invalid password restriction
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "aaaaaaaaaaa",
                },
                {                                                                               //invalid password restriction (too short)
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123!",
                },
                {                                                                               //invalid password restriction (too long)
                    first_name : "Firstname",
                    last_name : "Lastname",
                    display_name : "User01",
                    birth_date : "2012-10-07",
                    email : "user@gmail.com",
                    username : "User01",
                    password : "Qq123AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA!!",
                },

            ]
            for (const body of bodyData){
                const response = await request(app).post("/register").send(body)
                expect(response.statusCode).toBe(400)
            }
        })
    })
})*/