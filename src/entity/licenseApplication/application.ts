import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToMany,
    JoinTable,
    OneToMany,
    ManyToOne,
    OneToOne
} from "typeorm"

import { IsEmail, IsNotEmpty, Length } from "class-validator"
import { User } from "../authentication/User"

@Entity({ name: 'application' })
export class Application {

    @PrimaryGeneratedColumn("uuid")
    applicationId: string

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    arcGisUsername: string

    @Column()
    grade: string

    @Column()
    course: string

    @Column("text", {
        default: "org_user"
    })
    role?: string

    @Column("text", {
        default: "GISProfessionalAdvUT"
    })
    userLicenseType?: string

    @Column()
    fullname: string

    @Column("text", {
        default: "arcgisonly"
    })
    userType?: string

    @Column("text", {
        default: ""
    })
    groups?: string

    @Column({
        default: -1
    })
    userCreditAssignment?: number

    @Column({
        default: false
    })
    applyActUserDefaults?: boolean

    @Column({
        default: false
    })
    approved?: boolean

    //  @ManyToOne(() => User, user => user.applications)
    @OneToOne(() => User, user => user.application)
    user: User

}