import { Router } from 'express'

export type HTTPMETHOD = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "COPY" | "OPTIONS"

export interface IBaseControllerParam {
    routeHttpMethod: { [methodName: string]: HTTPMETHOD }
}

export interface IController {
    routerName: string
    routeHttpMethod: { [methodName: string]: HTTPMETHOD }
    getRouter(): Router
    setRouterName_HiddenMethod(): void
    bindRouter_HiddenMethod(routeName: string, routeHandler: any, httpMethod: HTTPMETHOD): void
    // injectDbContexts(dbcontexts: Array<DbContext>): void
}

export class BaseController implements IController {
    protected _router: Router
    public routerName: string
    public routeHttpMethod: { [methodName: string]: HTTPMETHOD }

    constructor(options: IBaseControllerParam =
        {
            routeHttpMethod: {}
        }
    ) {
        this._router = Router()
        this.setRouterName_HiddenMethod()
        this.routeHttpMethod = options.routeHttpMethod
    }

    public setRouterName_HiddenMethod = (): void => {
        this.routerName = '/'
        this.routerName += this.constructor.name.replace(/Controller/g, "")
    }

    public bindRouter_HiddenMethod = (routeName: string, routeHandler: any, httpMethod: HTTPMETHOD): void => {
        // this._router.get("/index", this.index)
        switch (httpMethod) {
            case "GET":
                this._router.get('/' + routeName, routeHandler)
                break;
            case "POST":
                this._router.post('/' + routeName, routeHandler)
                break;
            case "PUT":
                this._router.put('/' + routeName, routeHandler)
                break;
            case "PATCH":
                this._router.patch('/' + routeName, routeHandler)
                break;
            case "DELETE":
                this._router.delete('/' + routeName, routeHandler)
                break;
            case "COPY":
                this._router.copy('/' + routeName, routeHandler)
                break;
            case "OPTIONS":
                this._router.options('/' + routeName, routeHandler)
                break;
        }
    }

    public getRouter(): Router {
        return this._router
    }

    // public injectDbContexts = (dbcontexts: Array<DbContext>) => {
    //     const member_list: Array<string> = Object.getOwnPropertyNames(this)
    //     console.log(Object.fromEntries(this))
    //     const context_list = member_list.filter(member => member.includes("context"))
    // }
}

export const autoInjectSubRoutes = (controller: IController) => {
    const listMethods = (controller: IController): Array<string> => {
        const output: Array<string> = []
        for (var member in controller) {
            //@ts-ignore
            if (typeof controller[member] == "function") {
                if (controller.hasOwnProperty(member)) {
                    output.push(member)
                }
            }
        }
        return output
    }
    const excludeBaseMethods = (methods: Array<string>): Array<string> => {
        const output: Array<string> = []
        methods.forEach((method) => {
            if (!(method.includes("_HiddenMethod") || method === "_router")) {
                output.push(method)
            }
        })
        return output
    }
    excludeBaseMethods(listMethods(controller)).forEach((method) => {
        //@ts-ignore
        controller.bindRouter_HiddenMethod(method, controller[method], controller.routeHttpMethod[method])
    })
}

