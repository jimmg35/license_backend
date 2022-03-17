import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    OneToOne,
    JoinColumn,
    OneToMany,
    ManyToMany,
    JoinTable
} from "typeorm"

import { IsEmail, IsNotEmpty, Length } from "class-validator"
import { UserThumbnail } from "./UserThumbnail"

import { Role } from "./Role"
import { Application } from "../licenseApplication/Application"

@Entity({ name: 'user' })
export class User {

    @PrimaryGeneratedColumn("uuid")
    userId!: string

    @Column({ length: 20, unique: true })
    @IsNotEmpty({ message: 'username is required' })
    username!: string

    @Column()
    @IsNotEmpty({ message: 'password is required' })
    password!: string

    @Column({ length: 20, nullable: true })
    alias: string

    @ManyToMany(type => Role, role => role.users)
    @JoinTable()
    roles: Role[]

    @Column({ name: 'email' })
    @IsEmail({}, { message: 'Incorrect email' })
    @IsNotEmpty({ message: 'The email is required' })
    email!: string

    @Column({ nullable: true })
    phoneNumber: string

    @CreateDateColumn()
    createdDate!: Date

    @Column({ length: 128 })
    mailConfirmationToken!: string

    @Column({ default: false })
    isActive: boolean

    @OneToMany(() => UserThumbnail, userthumbnail => userthumbnail.user)
    thumbnails: UserThumbnail[]

    //  @OneToMany(() => Application, application => application.user)
    @OneToOne(() => Application)
    @JoinColumn()
    application: Application
}