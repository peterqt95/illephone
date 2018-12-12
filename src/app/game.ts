export class Game {
    id: number;
    name: string;
    maxPlayers: number;
    timeLimit: number;
    category: string;
    password: string;
    currentNumPlayers: number;

    constructor(id: number, name: string, maxPlayers: number, timeLimit: number, category: string, password:string, currentNumPlayers: number = 0){
        this.id = id;
        this.name = name;
        this.maxPlayers = maxPlayers;
        this.timeLimit = timeLimit;
        this.category = category;
        this.password = password;
        this.currentNumPlayers = currentNumPlayers;
    }
}