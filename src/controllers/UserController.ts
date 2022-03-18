import { generateVerificationToken, sendVerifcationEmail, sendPasswordResetEmail } from "./util"
import { BaseController, HTTPMETHOD } from './BaseController'
import { Role } from "../entity/authentication/Role"
import { User } from "../entity/authentication/User"
import { UserThumbnail } from "../entity/authentication/UserThumbnail"
import { PostgreSQLContext } from "../dbcontext"
import { Request, Response } from 'express'
import { autoInjectable } from "tsyringe"
import sha256 from "fast-sha256"
import StatusCodes from 'http-status-codes'
import util from "tweetnacl-util"
import JwtAuthenticator from "../lib/JwtAuthenticator"

const { BAD_REQUEST, OK, NOT_FOUND, FORBIDDEN, UNAUTHORIZED } = StatusCodes

@autoInjectable()
export default class UserController extends BaseController {


    public dbcontext: PostgreSQLContext
    public jwtAuthenticator: JwtAuthenticator
    public routeHttpMethod: { [methodName: string]: HTTPMETHOD; } = {
        "register": "POST",
        "isEmailUsed": "GET",
        "isUserExists": "GET",
        "sendVerifyEmail": "GET",
        "verify": "GET",
        "resetPassword": "POST",
        "sendPasswordResetEmail": "GET",
        "verifyPasswordResetEmail": "GET",
        "addThumbnail": "POST",
        "getThumbnail": "POST"
    }

    constructor(dbcontext: PostgreSQLContext, jwtAuthenticator: JwtAuthenticator) {
        super()
        this.dbcontext = dbcontext
        this.dbcontext.connect()
        this.jwtAuthenticator = jwtAuthenticator
    }


    public register = async (req: Request, res: Response) => {
        const params_set = { ...req.body }

        try {
            const user_repository = this.dbcontext.connection.getRepository(User)
            const role_repository = this.dbcontext.connection.getRepository(Role)
            const user = new User()
            user.username = params_set.username
            user.password = util.encodeBase64(sha256(params_set.password))
            user.roles = await role_repository.findByIds(params_set.roleId)
            user.email = params_set.email
            user.phoneNumber = params_set.phoneNumber
            user.mailConfirmationToken = generateVerificationToken(128)

            await user_repository.save(user)
            return res.status(OK).json({
                "status": "success"
            })
        } catch {
            return res.status(BAD_REQUEST).json({
                "status": "fail"
            })
        }

    }

    public isEmailUsed = async (req: Request, res: Response) => {
        const params_set = { ...req.query }

        const user_repository = this.dbcontext.connection.getRepository(User)
        const user = await user_repository.findOne({ email: params_set.email as string })

        if (user != undefined) {
            return res.status(OK).json({
                "status": "email has been used!"
            })
        }
        return res.status(NOT_FOUND).json({
            "status": "email hasn't been used!"
        })
    }

    public isUserExists = async (req: Request, res: Response) => {
        const params_set = { ...req.query }

        const user_repository = this.dbcontext.connection.getRepository(User)
        const user = await user_repository.findOne({ username: params_set.username as string })

        if (user != undefined) {
            return res.status(OK).json({
                "status": "user exists!"
            })
        }
        return res.status(NOT_FOUND).json({
            "status": "user doesn't exists!"
        })
    }

    public sendVerifyEmail = async (req: Request, res: Response) => {
        const params_set = { ...req.query }

        const user_repository = this.dbcontext.connection.getRepository(User)
        const user = await user_repository.findOne({ username: params_set.username as string })

        if (user != undefined) {
            const isSuccessed = await sendVerifcationEmail(user.email, user.username, user.mailConfirmationToken)

            if (isSuccessed) {
                return res.status(OK).json({
                    "status": "verification email sent"
                })
            }
            return res.status(500).json({
                "status": "SMTP server shut down"
            })

        } else {
            return res.status(NOT_FOUND).json({
                "status": "can't find this user"
            })
        }
    }

    public verify = async (req: Request, res: Response) => {
        const params_set = { ...req.query }

        const user_repository = this.dbcontext.connection.getRepository(User)
        const user = await user_repository.findOne({ username: params_set.username as string })

        if (user == undefined) {
            return res.status(NOT_FOUND).json({
                "status": "can't find this user"
            })
        }

        if (user.mailConfirmationToken == params_set.verificationToken) {
            user.isActive = true
            await user_repository.save(user)

            return res.redirect(process.env.FRONTEND_DOMAIN as string)
        }

        return res.status(BAD_REQUEST).json({
            "status": "wrong verificationToken"
        })
    }

    public resetPassword = async (req: Request, res: Response) => {
        const params_set = { ...req.body }

        const user_repository = this.dbcontext.connection.getRepository(User)

        const user = await user_repository.createQueryBuilder("user")
            .where("user.email = :email", { email: params_set.email })
            .getOne();

        if (user == undefined) {
            return res.status(NOT_FOUND).json({
                "status": "can't find this user"
            })
        }

        if (user.password !== util.encodeBase64(sha256(params_set.originalPassword))) {
            return res.status(FORBIDDEN).json({
                "status": "original password wrong"
            })
        } else {
            user.password = util.encodeBase64(sha256(params_set.newPassword))
            await user_repository.save(user)
            return res.status(OK).json({
                "status": "password changed successfully"
            })
        }
    }

    public sendPasswordResetEmail = async (req: Request, res: Response) => {
        const params_set = { ...req.query }

        const user_repository = this.dbcontext.connection.getRepository(User)
        const user = await user_repository.findOne({ email: params_set.email as string })

        if (user === undefined) {
            return res.status(NOT_FOUND).json({
                "status": "user not found!"
            })
        }

        if (user?.isActive === false) {
            return res.status(FORBIDDEN).json({
                "status": "please verify the email!"
            })
        }

        // 更新信箱token
        user.mailConfirmationToken = generateVerificationToken(128)

        // 重設暫時密碼
        const tempPassword = Math.random().toString(36).slice(-8)
        const encoded_once = util.encodeBase64(sha256(tempPassword as any))
        const encoded_twice = util.encodeBase64(sha256(encoded_once as any))
        user.password = encoded_twice

        await user_repository.save(user)

        // 發信
        if (user != undefined) {
            const isSuccessed = await sendPasswordResetEmail(user.email, user.mailConfirmationToken, tempPassword)

            if (isSuccessed) {
                return res.status(OK).json({
                    "status": "verification email sent"
                })
            }
            return res.status(500).json({
                "status": "SMTP server shut down"
            })

        } else {
            return res.status(NOT_FOUND).json({
                "status": "can't find this user"
            })
        }
    }

    public verifyPasswordResetEmail = async (req: Request, res: Response) => {
        const params_set = { ...req.query }

        const user_repository = this.dbcontext.connection.getRepository(User)
        const user = await user_repository.findOne({ email: params_set.email as string })

        if (user === undefined) {
            return res.status(NOT_FOUND).json({
                "status": "user not found!"
            })
        }

        if (user.mailConfirmationToken === params_set.verificationToken) {
            let passwordResetURL = process.env.FRONTEND_DOMAIN as string + '/passwordreset'
            return res.redirect(passwordResetURL)
        }
        return res.status(FORBIDDEN).json({
            "status": "Wrong verification token!"
        })
    }

    public addThumbnail = async (req: Request, res: Response) => {
        const params_set = { ...req.body }
        const { status, payload } = this.jwtAuthenticator.isTokenValid(params_set.token)
        if (status) {
            const user_repository = this.dbcontext.connection.getRepository(User)
            const userThumbnail_repository = this.dbcontext.connection.getRepository(UserThumbnail)
            const user = await user_repository.findOne({ userId: payload._userId })
            const userThumbnail = new UserThumbnail()
            userThumbnail.thumbnail = params_set.thumbnailBase64
            userThumbnail.user = user as User
            await userThumbnail_repository.save(userThumbnail)
            return res.status(OK).json({
                "status": "thumbnail upload success"
            })
        }
        return res.status(UNAUTHORIZED).json({
            "status": "token is not valid"
        })
    }

    public getThumbnail = async (req: Request, res: Response) => {
        const params_set = { ...req.body }
        const { status, payload } = this.jwtAuthenticator.isTokenValid(params_set.token)
        if (status) {
            const user_repository = this.dbcontext.connection.getRepository(User)
            const user = await user_repository.createQueryBuilder("user")
                .where("user.userId = :userId", { userId: payload._userId })
                .leftJoinAndSelect("user.thumbnails", "userthumbnail").getOne()
            return res.status(OK).json(user?.thumbnails[user?.thumbnails.length - 1])
        }
        return res.status(UNAUTHORIZED).json({
            "status": "token is not valid"
        })
    }
}
