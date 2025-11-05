const fs = require('fs').promises;
const path = require('path');

class UserDataManager {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.filePath = path.join(this.dataDir, 'users.json');
    }

    async initialize() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            
            try {
                await this.readData();
                console.log('User data file ready');
            } catch (error) {
                console.log('Creating new user data file...');
                await this.writeData([]);
            }
        } catch (error) {
            console.error('Error initializing UserDataManager:', error);
            throw error;
        }
    }

    async readData() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            if (!data.trim()) return [];
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') return [];
            throw error;
        }
    }

    async writeData(data) {
        try {
            await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            throw error;
        }
    }

    async addUser(userData) {
        try {
            const users = await this.readData();
            
            const newUser = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: userData.password,
                registrationDate: new Date().toISOString()
            };

            // Check for duplicate email
            const existingUser = users.find(user => user.email === userData.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            users.push(newUser);
            await this.writeData(users);
            
            return newUser;
        } catch (error) {
            throw error;
        }
    }

    async getAllUsers() {
        return await this.readData();
    }

    async getUserCount() {
        const users = await this.readData();
        return users.length;
    }
}

module.exports = UserDataManager;