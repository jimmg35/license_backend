var fetch = require('node-fetch')

export interface IInvitePayload {
    email: string
    firstname: string
    lastname: string
    username: string
    fullname: string
}

export default class LicenseSender {
    constructor() {
    }

    private generateToken = async () => {
        const url = 'https://ntnugis.maps.arcgis.com/sharing/rest/generateToken'
        const headersList = {
            Accept: '*/*',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        const bodyContent = `username=NTNU_ARCGIS&password=admin_146&client=ip&ip=39.9.232.222&referer=&expiration=60&f=json`
        const response = await fetch(url, {
            method: 'POST',
            body: bodyContent,
            headers: headersList
        })
        return response
    }

    public sendMail = async (payload: IInvitePayload) => {
        const responseContent = await (await this.generateToken()).json()
        const token = responseContent.token
        // ====================================

        const url = 'https://ntnugis.maps.arcgis.com/sharing/rest/portals/self/invite'
        const headersList = {
            Accept: '*/*',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        const bodyContent = `invitationList={"invitations":[{"email":"${payload.email}","firstname":"${payload.firstname}","lastname":"${payload.lastname}","username":"${payload.username}","role":"pliIP33SSi55yset","userLicenseType":"GISProfessionalAdvUT","fullname":"${payload.fullname}","userType":"arcgisonly","groups":"","userCreditAssignment":-1,"applyActUserDefaults":false}]}&message=空間資訊學程地理學系 has invited you to join an ArcGIS Online Organization, 國立臺灣師範大學地理學系.&f=json&token=${token}`
        // console.log(bodyContent)
        const response = await fetch(url, {
            method: 'POST',
            body: bodyContent,
            headers: headersList
        })
        return response

    }
}
