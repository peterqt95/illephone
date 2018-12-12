import { User } from './user';

export class Message {
    public user: User;
    public text: string;
    public src: string;

    constructor(user: User = new User(), text: string = "", src: string = ""){
        this.user = user;
        this.text = text;
        this.src = src;
    }
}