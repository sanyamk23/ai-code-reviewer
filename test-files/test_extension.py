def test_function():
    password = "secret123"  # This should trigger security warning
    x=1+2  # Missing spaces around operator
    if True
        print("Missing colon")  # Missing colon
    
    # Long line that exceeds 79 characters and should trigger a PEP8 warning about line length
    very_long_variable_name = "This is a very long string that definitely exceeds the 79 character limit"
    
    return x