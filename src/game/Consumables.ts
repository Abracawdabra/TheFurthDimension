/**
 * The Furth Dimension
 * @author Cawdabra <cawdabra@null.net>
 * @license MIT
 */

export interface IConsumable {
    name: string;
    price: number;
    // How long its effects last in seconds
    duration?: number;
    health?: number;
    power?: number;
    defense?: number;
    speed?: number;
    maxHealth?: number;
    luck?: number;
}

export var Consumables: { [id: string]: IConsumable } = {
    "watermelon": {
        name: "Watermelon",
        price: 25,
        health: 50
    },
    "dog_treat": {
        name: "Dog Treat",
        price: 150,
        health: 375
    },
    "fish": {
        name: "Fish",
        price: 400,
        health: 1600
    },
    "salami": {
        name: "Salami",
        price: 50,
        duration: 300,
        maxHealth: 50
    },
    "krunkaroos": {
        name: "Krunk-a-roos",
        price: 150,
        duration: 300,
        maxHealth: 200
    },
    "sausage": {
        name: "Sausage",
        price: 500,
        duration: 300,
        maxHealth: 500,
        luck: 0.15
    },
    "bacon": {
        name: "Bacon",
        price: 80,
        duration: 300,
        speed: 2
    },
    "roast_beef": {
        name: "Roast Beef",
        price: 400,
        duration: 300,
        speed: 4
    },
    "cheese": {
        name: "Cheese",
        price: 100,
        duration: 300,
        luck: 0.05
    },
    "phallic_waffle": {
        name: "Phallic Waffle",
        price: 200,
        duration: 300,
        luck: 0.10
    },
    "turkey_bone": {
        name: "Turkey Bone",
        price: 400,
        duration: 300,
        luck: 0.15
    },
    "peanut_butter": {
        name: "Peanut Butter",
        price: 100,
        duration: 300,
        power: 2
    },
    "cookie_krysp": {
        name: "Cookie Krysp",
        price: 100,
        duration: 300,
        defense: 2
    },
    "frosted_butts": {
        name: "Frosted Butts",
        price: 250,
        duration: 300,
        defense: 4
    },
    "frooty_brutey": {
        name: "Frooty Brutey",
        price: 625,
        duration: 300,
        defense: 8
    },
    "eggs": {
        name: "Eggs",
        price: 100,
        duration: 300,
        power: 2
    },
    "chicken": {
        name: "Chicken",
        price: 250,
        duration: 300,
        power: 4
    },
    "steak": {
        name: "Steak",
        price: 625,
        duration: 300,
        power: 8
    },
    "cheattoes": {
        name: "Cheat-toes",
        price: 1000,
        duration: 600,
        power: 10,
        defense: 10,
        luck: 0.20
    },
    "lemon": {
        name: "Lemon",
        price: 10,
        duration: 3600,
        power: -6,
        defense: -6,
        speed: -3,
        luck: -0.10
    }
}
