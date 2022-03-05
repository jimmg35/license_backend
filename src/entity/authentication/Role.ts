import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToMany
} from "typeorm"

import { IsEmail, IsNotEmpty, Length } from "class-validator"

import { User } from "./User"

@Entity({ name: "role" })
export class Role {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 50,
    })
    roleName: string;

    @ManyToMany(type => User, user => user.roles) //設定bi-directional關聯
    users: User[];
}