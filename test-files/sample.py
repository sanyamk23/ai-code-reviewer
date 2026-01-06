def bad_function(a, b, c, d, e, f, g, h):  # Too many parameters
    """This function demonstrates various code issues."""
    print("Debug message - should use logging")  # Print statement

    # Security issue - hardcoded password
    password = "admin123"
    
    # Performance issue - inefficient loop
    result = ""

    for i in range(len(a)):
        result += str(a[i])  # String concatenation in loop

    # Error handling issues
    try:
        division = b / c
    except:  # Bare except clause
        pass  # Empty except handler
    
    # Missing type hints and return statement
    return result

class MyClass:  # Missing docstring
    def __init__(self):
        self.data = []
    
    def method_without_docstring(self):
        # TODO: implement this method properly
        x = 1
        y = 2
        # Unused variables
        z = x + y
        
        # Complex nested conditions (high complexity)
        if x > 0:
            if y > 0:
                if z > 0:
                    if x + y + z > 5:
                        if len(self.data) > 0:
                            return True
        return False

def good_function(items: list) -> str:
    """
    This function demonstrates good practices.
    
    Args:
        items: List of items to process
        
    Returns:
        Processed string result
    """
    import logging
    
    logging.info("Processing items")
    
    try:
        result = "".join(str(item) for item in items)
        return result
    except (TypeError, ValueError) as e:
        logging.error(f"Error processing items: {e}")
        return ""

# More issues to detect
import os
import sys  # Unused import

# SQL injection vulnerability
def unsafe_query(user_input):
    query = f"SELECT * FROM users WHERE name = '{user_input}'"
    return query

# Weak cryptography
import hashlib
def weak_hash(password):
    return hashlib.md5(password.encode()).hexdigest()

# Performance anti-patterns
def inefficient_search(items, target):
    found_items = []
    for item in items:
        if item == target:
            found_items.append(item)
    return found_items