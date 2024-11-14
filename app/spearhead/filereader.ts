import fs from 'fs';
import path from 'path';

// Define an interface that matches the structure of your JSON data
interface Data {
  // Define your data structure here
  // For example:
  name: string;
  age: number;
  // Add other properties as needed
}

function readJsonFile(filePath: string): Data {
  try {
    // Read the file synchronously
    const jsonString = fs.readFileSync(filePath, 'utf-8');
    
    // Parse the JSON string
    const data: Data = JSON.parse(jsonString);
    
    return data;
  } catch (error) {
    console.error('Error reading or parsing the JSON file:', error);
    throw error;
  }
}

// Usage
const filePath = path.join(__dirname, 'data.json');
const jsonData = readJsonFile(filePath);

console.log(jsonData);

// You can now use the data
console.log(jsonData.name);
console.log(jsonData.age);