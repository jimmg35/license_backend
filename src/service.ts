import { Server } from "./server"
import {
    HomeController,
    UserController,
    AuthController,
    LicenseController
} from './controllers'
import { Seeder } from "./seeding"
import { container } from "tsyringe"



(async () => {

    // 輸入資料
    // const seeder = container.resolve(Seeder)
    // await seeder.dbcontext.connect()
    // await seeder.seedRole()
    // await seeder.dbcontext.connection.close()

    // 註冊controllers
    const homeController = container.resolve(HomeController)
    const userController = container.resolve(UserController)
    const authController = container.resolve(AuthController)
    const licenseController = container.resolve(LicenseController)
    const server = new Server({
        controllers: [
            homeController,
            userController,
            authController,
            licenseController
        ]
    })

    // 啟動後端伺服器
    server.start()

})();
