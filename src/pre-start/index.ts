import "reflect-metadata"
import path from 'path'
import dotenv from 'dotenv'
import commandLineArgs from 'command-line-args'


(() => {
    const options = commandLineArgs([
        {
            name: 'env',
            alias: 'e',
            defaultValue: 'development',
            type: String,
        }
    ])

    const envConfig = dotenv.config({
        path: path.join(__dirname, `../../envConfig/development.env`),
    })

    if (envConfig.error) {
        throw envConfig.error;
    }
})();

