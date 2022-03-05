import jwt from 'jsonwebtoken'



export interface tokenPayload {
    _userId: string
    username: string
    email: string
    alias: string
}

export default class JwtAuthenticator {

    public expireTime: number

    constructor() {
        this.expireTime = 3600
    }

    /**
     * 負責簽發jwt token
     */
    public signToken = (payload: tokenPayload): string => {
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET as string,
            { expiresIn: this.expireTime }
        )
        return token
    }

    /**
     * 計算Token剩餘時間
     * @param token 
     * @returns 
     */
    public computeLeftTime = (token: string) => {
        const payload: any = jwt.decode(token)!
        const expirationTime = payload.exp
        const currentTime = Math.floor(Date.now() / 1000)
        const timeDelta = expirationTime - currentTime
        return timeDelta
    }

    /**
     * 檢查Token是否過期
     * @param token 
     * @returns 
     */
    public isTokenExpired = (token: string): boolean => {
        const timeDelta = this.computeLeftTime(token)
        if (timeDelta > 0) {
            return false
        }
        return true
    }

    /**
     * 檢查Token是否有效
     * @param token 
     * @returns 
     */
    public isTokenValid = (token: string): any => {
        try {
            const status = true
            const payload: any = jwt.verify(token, process.env.JWT_SECRET as string)
            return { status, payload }
        } catch {
            return false
        }
    }

    /**
     * 解析payload內容
     * @param token 
     */
    public decodePayload = (token: string) => {
        let aa = jwt.decode(token)
        console.log(aa)
    }

}

// (() => {
//     const ja = new JwtAuthenticator()

//     let token = ja.signToken({
//         _userId: "123",
//         username: "jimmg35"
//     })

//     console.log(token)
//     const aa = ja.isTokenExpired("eyJhbGciOaaaiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfdXNlcklkIjoiMTIzIiwidXNlcm5hbWUiOiJqaW1tZzM1IiwiaWF0IjoxNjQxODMxNzMxLCJleHAiOjE2NDE4MzE3MzZ9.ck8CsZ_eaaaa7AtlBwP3GnlqaoMD0sxJ70XESl922gQV2w8")
//     console.log(aa)
//     // setTimeout(() => {
//     //     const tokenStatus = ja.isTokenValid(token)
//     //     console.log(tokenStatus)
//     // }, 10000)
// })()