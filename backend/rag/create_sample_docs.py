#!/usr/bin/env python3
"""
Create sample documents for testing upload_docs.py script

This script creates a sample folder structure with various document types
to test the document upload functionality.
"""

import os
import json
from pathlib import Path

def create_sample_documents(base_folder: str = "sample_docs"):
    """Create sample documents for testing"""
    
    base_path = Path(base_folder)
    base_path.mkdir(exist_ok=True)
    
    print(f"📁 Creating sample documents in: {base_path.absolute()}")
    
    # Create folder structure
    folders = {
        "python/beginner": [],
        "python/intermediate": [],
        "javascript/basics": [],
        "math/calculus": [],
        "lessons": [],
        "exercises": [],
        "assessments": []
    }
    
    for folder in folders:
        (base_path / folder).mkdir(parents=True, exist_ok=True)
    
    # Sample documents content
    documents = {
        # Python Beginner
        "python/beginner/python_intro.txt": """
Introduction to Python Programming

Python is a high-level, interpreted programming language that's perfect for beginners.

Key Features:
1. Easy to read and write
2. Extensive standard library
3. Cross-platform compatibility
4. Large community support

Getting Started:
- Install Python from python.org
- Use IDLE or PyCharm as your IDE
- Start with simple print statements
- Learn about variables and data types

Basic Syntax:
print("Hello, World!")
name = "Python"
age = 30
        """,
        
        "python/beginner/variables_and_types.txt": """
Python Variables and Data Types

Variables in Python:
- No need to declare variable types
- Dynamic typing
- Case-sensitive names

Data Types:
1. Numbers: int, float, complex
2. Strings: text data
3. Booleans: True/False
4. Lists: ordered collections
5. Dictionaries: key-value pairs

Examples:
number = 42
text = "Hello Python"
is_ready = True
colors = ["red", "green", "blue"]
person = {"name": "Alice", "age": 25}
        """,
        
        # Python Intermediate
        "python/intermediate/functions_and_classes.txt": """
Python Functions and Classes

Functions:
- Reusable blocks of code
- Can accept parameters
- Can return values
- Support default arguments

def greet(name, message="Hello"):
    return f"{message}, {name}!"

Classes:
- Blueprint for creating objects
- Encapsulate data and methods
- Support inheritance

class Student:
    def __init__(self, name, grade):
        self.name = name
        self.grade = grade
    
    def study(self, subject):
        return f"{self.name} is studying {subject}"

Object-Oriented Programming:
- Encapsulation
- Inheritance
- Polymorphism
        """,
        
        # JavaScript
        "javascript/basics/js_fundamentals.txt": """
JavaScript Fundamentals

JavaScript is a programming language that runs in web browsers and servers.

Key Concepts:
1. Variables: let, const, var
2. Functions: function declarations and expressions
3. Objects: key-value pairs
4. Arrays: ordered lists
5. DOM manipulation

Basic Syntax:
let message = "Hello JavaScript";
const PI = 3.14159;

function calculateArea(radius) {
    return PI * radius * radius;
}

const user = {
    name: "John",
    age: 30,
    email: "john@example.com"
};

Common Use Cases:
- Web page interactivity
- Form validation
- API communication
- Dynamic content updates
        """,
        
        # Math
        "math/calculus/derivatives_intro.txt": """
Introduction to Derivatives

A derivative represents the rate of change of a function with respect to a variable.

Basic Definition:
f'(x) = lim(h→0) [f(x+h) - f(x)] / h

Common Derivative Rules:
1. Power Rule: d/dx(x^n) = nx^(n-1)
2. Constant Rule: d/dx(c) = 0
3. Sum Rule: d/dx(f+g) = f' + g'
4. Product Rule: d/dx(fg) = f'g + fg'
5. Chain Rule: d/dx(f(g(x))) = f'(g(x)) * g'(x)

Examples:
- d/dx(x²) = 2x
- d/dx(3x³) = 9x²
- d/dx(sin(x)) = cos(x)
- d/dx(e^x) = e^x

Applications:
- Finding maximum and minimum values
- Analyzing motion and velocity
- Optimization problems
- Economics and business
        """,
        
        # Lessons
        "lessons/programming_basics_lesson.txt": """
Programming Basics - Lesson 1

Objective: Understanding fundamental programming concepts

What is Programming?
Programming is the process of creating instructions for computers to follow.

Key Concepts:
1. Algorithm: Step-by-step solution to a problem
2. Syntax: Rules of a programming language
3. Variables: Storage locations for data
4. Control Structures: if/else, loops
5. Functions: Reusable code blocks

Programming Workflow:
1. Understand the problem
2. Plan the solution
3. Write the code
4. Test and debug
5. Document your work

Best Practices:
- Write clear, readable code
- Use meaningful variable names
- Comment your code
- Test thoroughly
- Follow coding standards

Exercise:
Write a program that calculates the area of a rectangle.
        """,
        
        # Exercises
        "exercises/python_practice_problems.txt": """
Python Practice Problems

Problem 1: Calculator
Create a simple calculator that can add, subtract, multiply, and divide two numbers.

def calculator(num1, num2, operation):
    # Your code here
    pass

Problem 2: List Operations
Write functions to:
- Find the maximum number in a list
- Count how many times a value appears
- Remove duplicates from a list

Problem 3: String Manipulation
Create functions that:
- Reverse a string
- Check if a string is a palindrome
- Count vowels in a string

Problem 4: File Operations
Write a program that:
- Reads a text file
- Counts the number of words
- Finds the most common word

Problem 5: Class Design
Design a Library class that can:
- Add books
- Remove books
- Search for books by title or author
- Track borrowed books

Solution Guidelines:
- Use descriptive variable names
- Add comments to explain your logic
- Handle edge cases
- Test your functions with different inputs
        """,
        
        # Assessments
        "assessments/programming_quiz.txt": """
Programming Knowledge Quiz

Question 1: Data Types
Which of the following is NOT a valid Python data type?
a) int
b) string
c) boolean
d) decimal

Question 2: Functions
What is the output of this code?
def multiply(a, b=2):
    return a * b

print(multiply(5))

a) 5
b) 10
c) Error
d) None

Question 3: Lists
How do you add an item to the end of a list in Python?
a) list.add(item)
b) list.append(item)
c) list.insert(item)
d) list.push(item)

Question 4: Loops
Which loop is best for iterating over a list?
a) while loop
b) for loop
c) do-while loop
d) repeat loop

Question 5: Object-Oriented Programming
What does "self" refer to in a Python class method?
a) The class itself
b) The current instance of the class
c) The parent class
d) A global variable

Question 6: Error Handling
Which keyword is used to handle exceptions in Python?
a) catch
b) except
c) handle
d) error

Answers:
1. d) decimal (Python uses 'float' for decimal numbers)
2. b) 10 (default parameter b=2, so 5*2=10)
3. b) list.append(item)
4. b) for loop
5. b) The current instance of the class
6. b) except
        """
    }
    
    # Create JSON data file
    json_data = {
        "course_info": {
            "name": "Introduction to Programming",
            "duration": "12 weeks",
            "difficulty": "beginner",
            "topics": [
                "Variables and Data Types",
                "Control Structures", 
                "Functions",
                "Object-Oriented Programming",
                "File Operations",
                "Error Handling"
            ]
        },
        "modules": [
            {
                "module_id": 1,
                "title": "Getting Started",
                "lessons": [
                    "What is Programming?",
                    "Setting up Development Environment",
                    "Your First Program"
                ],
                "duration_hours": 4
            },
            {
                "module_id": 2,
                "title": "Basic Concepts", 
                "lessons": [
                    "Variables and Data Types",
                    "Input and Output",
                    "Basic Operations"
                ],
                "duration_hours": 6
            },
            {
                "module_id": 3,
                "title": "Control Flow",
                "lessons": [
                    "Conditional Statements",
                    "Loops",
                    "Breaking and Continuing"
                ],
                "duration_hours": 8
            }
        ],
        "resources": [
            {"type": "book", "title": "Python Crash Course", "author": "Eric Matthes"},
            {"type": "video", "title": "Python for Beginners", "platform": "YouTube"},
            {"type": "practice", "title": "Coding Exercises", "platform": "HackerRank"}
        ]
    }
    
    documents["course_data.json"] = json.dumps(json_data, indent=2)
    
    # Write all documents
    for file_path, content in documents.items():
        full_path = base_path / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content.strip())
        
        print(f"   ✅ Created: {file_path}")
    
    print(f"\n📊 Summary:")
    print(f"   📁 Created {len(folders)} folders")
    print(f"   📄 Created {len(documents)} files")
    print(f"   📍 Location: {base_path.absolute()}")
    
    # Print usage instructions
    print(f"\n🚀 Test the upload script:")
    print(f"   cd backend/rag")
    print(f"   python upload_docs.py {base_folder}")
    print(f"   python upload_docs.py {base_folder} --recursive")
    print(f"   python upload_docs.py {base_folder} --dry-run --recursive")
    print(f"   python upload_docs.py {base_folder} --parallel --max-workers 3")

if __name__ == "__main__":
    create_sample_documents()