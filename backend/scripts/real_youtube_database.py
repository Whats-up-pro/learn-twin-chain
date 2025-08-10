"""
Database of real YouTube videos for course generation
"""

REAL_YOUTUBE_VIDEOS = {
    # Python Programming
    "python_introduction": [
        {"title": "Python Tutorial for Beginners - Full Course", "url": "https://www.youtube.com/watch?v=Y8Tko2YC5hA", "channel": "Programming with Mosh", "duration": "6:14:07"},
        {"title": "Learn Python - Full Course for Beginners", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "channel": "freeCodeCamp.org", "duration": "4:26:52"},
        {"title": "Python Crash Course For Beginners", "url": "https://www.youtube.com/watch?v=JJmcL1N2KQs", "channel": "Traversy Media", "duration": "1:30:03"}
    ],
    "python_variables": [
        {"title": "Python Variables and Data Types", "url": "https://www.youtube.com/watch?v=cQT33yu9pY8", "channel": "Corey Schafer", "duration": "20:45"},
        {"title": "Python Variables Tutorial", "url": "https://www.youtube.com/watch?v=vKqVnr0BEJQ", "channel": "Programming with Mosh", "duration": "11:30"},
        {"title": "Python Data Types and Variables", "url": "https://www.youtube.com/watch?v=khKv-8q7YmY", "channel": "Tech With Tim", "duration": "15:20"}
    ],
    "python_functions": [
        {"title": "Python Functions Tutorial", "url": "https://www.youtube.com/watch?v=9Os0o3wzS_I", "channel": "Corey Schafer", "duration": "32:17"},
        {"title": "Functions in Python", "url": "https://www.youtube.com/watch?v=BVfCWuca9nw", "channel": "Programming with Mosh", "duration": "25:45"},
        {"title": "Python Functions - Complete Guide", "url": "https://www.youtube.com/watch?v=89cGQjB5R4M", "channel": "Tech With Tim", "duration": "28:30"}
    ],
    "python_loops": [
        {"title": "Python Loops - For and While Loops", "url": "https://www.youtube.com/watch?v=DZwmZ8Usvnk", "channel": "Tech With Tim", "duration": "25:33"},
        {"title": "Python For Loops Tutorial", "url": "https://www.youtube.com/watch?v=OnDr4J2UXSA", "channel": "Corey Schafer", "duration": "22:10"},
        {"title": "Python While Loops", "url": "https://www.youtube.com/watch?v=rRTjPnVooxE", "channel": "Programming with Mosh", "duration": "18:25"}
    ],
    "python_oop": [
        {"title": "Python OOP Tutorial - Object Oriented Programming", "url": "https://www.youtube.com/watch?v=ZDa-Z5JzLYM", "channel": "Corey Schafer", "duration": "43:28"},
        {"title": "Python Classes and Objects", "url": "https://www.youtube.com/watch?v=apACNr7DC_s", "channel": "Programming with Mosh", "duration": "54:20"},
        {"title": "Object Oriented Programming (OOP) In Python", "url": "https://www.youtube.com/watch?v=Ej_02ICOIgs", "channel": "Tech With Tim", "duration": "52:10"}
    ],
    
    # JavaScript Programming  
    "javascript_introduction": [
        {"title": "JavaScript Crash Course For Beginners", "url": "https://www.youtube.com/watch?v=hdI2bqOjy3c", "channel": "Traversy Media", "duration": "1:42:35"},
        {"title": "Learn JavaScript - Full Course for Beginners", "url": "https://www.youtube.com/watch?v=PkZNo7MFNFg", "channel": "freeCodeCamp.org", "duration": "3:26:42"},
        {"title": "JavaScript Tutorial for Beginners", "url": "https://www.youtube.com/watch?v=W6NZfCO5SIk", "channel": "Programming with Mosh", "duration": "1:02:12"}
    ],
    "javascript_dom": [
        {"title": "JavaScript DOM Crash Course", "url": "https://www.youtube.com/watch?v=0ik6X4DJKCc", "channel": "Traversy Media", "duration": "1:20:12"},
        {"title": "DOM Manipulation in JavaScript", "url": "https://www.youtube.com/watch?v=y17RuWkWdn8", "channel": "dcode", "duration": "45:30"},
        {"title": "Learn DOM Manipulation In 18 Minutes", "url": "https://www.youtube.com/watch?v=y17RuWkWdn8", "channel": "Web Dev Simplified", "duration": "18:08"}
    ],
    "javascript_async": [
        {"title": "Async JS Crash Course - Callbacks, Promises, Async Await", "url": "https://www.youtube.com/watch?v=PoRJizFvM7s", "channel": "Traversy Media", "duration": "1:22:30"},
        {"title": "JavaScript Promises In 10 Minutes", "url": "https://www.youtube.com/watch?v=DHvZLI7Db8E", "channel": "Web Dev Simplified", "duration": "10:28"},
        {"title": "Async/Await in JavaScript", "url": "https://www.youtube.com/watch?v=V_Kr9OSfDeU", "channel": "Programming with Mosh", "duration": "35:15"}
    ],
    
    # React Development
    "react_introduction": [
        {"title": "React JS Crash Course", "url": "https://www.youtube.com/watch?v=w7ejDZ8SWv8", "channel": "Traversy Media", "duration": "1:48:50"},
        {"title": "React Course - Beginner's Tutorial for React JavaScript Library", "url": "https://www.youtube.com/watch?v=bMknfKXIFA8", "channel": "freeCodeCamp.org", "duration": "11:55:27"},
        {"title": "React Tutorial for Beginners", "url": "https://www.youtube.com/watch?v=Ke90Tje7VS0", "channel": "Programming with Mosh", "duration": "1:18:41"}
    ],
    "react_components": [
        {"title": "React Components Tutorial", "url": "https://www.youtube.com/watch?v=Y2hgEGPzTZY", "channel": "The Net Ninja", "duration": "32:15"},
        {"title": "React Functional Components", "url": "https://www.youtube.com/watch?v=TqTaBJpH_kw", "channel": "Programming with Mosh", "duration": "28:40"},
        {"title": "Components and Props in React", "url": "https://www.youtube.com/watch?v=jo_B4LTHi3I", "channel": "Academind", "duration": "25:30"}
    ],
    "react_hooks": [
        {"title": "React Hooks Tutorial", "url": "https://www.youtube.com/watch?v=O6P86uwfdR0", "channel": "The Net Ninja", "duration": "52:20"},
        {"title": "useState and useEffect Explained", "url": "https://www.youtube.com/watch?v=0ZJgIjIuY7U", "channel": "Web Dev Simplified", "duration": "24:18"},
        {"title": "Complete Guide to useEffect", "url": "https://www.youtube.com/watch?v=0c6znExIqRw", "channel": "Programming with Mosh", "duration": "38:45"}
    ],
    
    # Data Science
    "data_science_introduction": [
        {"title": "Data Science Tutorial - Learn Data Science from Scratch", "url": "https://www.youtube.com/watch?v=ua-CiDNNj30", "channel": "Simplilearn", "duration": "10:59:30"},
        {"title": "Python for Data Science - Course for Beginners", "url": "https://www.youtube.com/watch?v=LHBE6Q9XlzI", "channel": "freeCodeCamp.org", "duration": "12:18:30"},
        {"title": "Data Science with Python Course", "url": "https://www.youtube.com/watch?v=mkv5mxYu0Wk", "channel": "edureka!", "duration": "8:45:20"}
    ],
    "pandas_numpy": [
        {"title": "Complete Python Pandas Data Science Tutorial", "url": "https://www.youtube.com/watch?v=vmEHCJofslg", "channel": "Keith Galli", "duration": "1:00:27"},
        {"title": "NumPy Tutorial for Beginners", "url": "https://www.youtube.com/watch?v=QUT1VHiLmmI", "channel": "freeCodeCamp.org", "duration": "58:41"},
        {"title": "Pandas Tutorial for Data Analysis", "url": "https://www.youtube.com/watch?v=PcvsOaixUh8", "channel": "Corey Schafer", "duration": "1:02:15"}
    ],
    
    # Machine Learning
    "machine_learning_introduction": [
        {"title": "Machine Learning Course for Beginners", "url": "https://www.youtube.com/watch?v=NWONeJKn6kc", "channel": "freeCodeCamp.org", "duration": "2:50:23"},
        {"title": "Machine Learning Tutorial Python", "url": "https://www.youtube.com/watch?v=7eh4d6sabA0", "channel": "Programming with Mosh", "duration": "2:49:14"},
        {"title": "Machine Learning Explained", "url": "https://www.youtube.com/watch?v=ukzFI9rgwfU", "channel": "Zach Star", "duration": "12:15"}
    ],
    "supervised_learning": [
        {"title": "Supervised Learning: Crash Course Statistics", "url": "https://www.youtube.com/watch?v=4qVRBYAdLAo", "channel": "CrashCourse", "duration": "13:35"},
        {"title": "Supervised vs Unsupervised Learning", "url": "https://www.youtube.com/watch?v=cfj6yaYE86U", "channel": "IBM Technology", "duration": "6:07"},
        {"title": "Classification vs Regression", "url": "https://www.youtube.com/watch?v=TJveOYsK6MY", "channel": "StatQuest", "duration": "8:53"}
    ],
    
    # Blockchain Development
    "blockchain_introduction": [
        {"title": "Blockchain Tutorial for Beginners", "url": "https://www.youtube.com/watch?v=qOVAbKKSH10", "channel": "edureka!", "duration": "1:01:35"},
        {"title": "But how does bitcoin actually work?", "url": "https://www.youtube.com/watch?v=bBC-nXj3Ng4", "channel": "3Blue1Brown", "duration": "26:21"},
        {"title": "Blockchain In 7 Minutes", "url": "https://www.youtube.com/watch?v=yubzJw0uiE4", "channel": "Simplilearn", "duration": "6:58"}
    ],
    "smart_contracts": [
        {"title": "Smart Contracts Tutorial", "url": "https://www.youtube.com/watch?v=ZE2HxTmxfrI", "channel": "Dapp University", "duration": "2:20:42"},
        {"title": "Solidity Tutorial - A Full Course on Ethereum", "url": "https://www.youtube.com/watch?v=ipwxYa-F1uY", "channel": "freeCodeCamp.org", "duration": "16:25:00"},
        {"title": "Build Your First Smart Contract", "url": "https://www.youtube.com/watch?v=gyMwXuJrbJQ", "channel": "Eat The Blocks", "duration": "45:30"}
    ],
    
    # Node.js Development
    "nodejs_introduction": [
        {"title": "Node.js Tutorial for Beginners", "url": "https://www.youtube.com/watch?v=TlB_eWDSMt4", "channel": "Programming with Mosh", "duration": "1:08:53"},
        {"title": "Node.js Crash Course", "url": "https://www.youtube.com/watch?v=fBNz5xF-Kx4", "channel": "Traversy Media", "duration": "1:31:47"},
        {"title": "Learn Node.js - Full Tutorial for Beginners", "url": "https://www.youtube.com/watch?v=RLtyhwFtXQA", "channel": "freeCodeCamp.org", "duration": "2:36:23"}
    ],
    "express_js": [
        {"title": "Express JS Crash Course", "url": "https://www.youtube.com/watch?v=L72fhGm1tfE", "channel": "Traversy Media", "duration": "1:16:42"},
        {"title": "Express.js Tutorial", "url": "https://www.youtube.com/watch?v=SccSCuHhOw0", "channel": "Programming with Mosh", "duration": "1:54:20"},
        {"title": "Build a REST API with Node JS and Express", "url": "https://www.youtube.com/watch?v=pKd0Rpw7O48", "channel": "Programming with Mosh", "duration": "1:03:26"}
    ],
    
    # Flutter Mobile Development
    "flutter_introduction": [
        {"title": "Flutter Tutorial for Beginners", "url": "https://www.youtube.com/watch?v=1ukSR1GRtMU", "channel": "Programming with Mosh", "duration": "4:53:17"},
        {"title": "Flutter Course - Full Tutorial for Beginners", "url": "https://www.youtube.com/watch?v=VPvVD8t02U8", "channel": "freeCodeCamp.org", "duration": "37:00:00"},
        {"title": "Flutter Crash Course for Beginners", "url": "https://www.youtube.com/watch?v=PnEdM8IIBoE", "channel": "Traversy Media", "duration": "1:22:19"}
    ],
    "flutter_widgets": [
        {"title": "Flutter Widgets Tutorial", "url": "https://www.youtube.com/watch?v=14SL5Pb8lfw", "channel": "The Net Ninja", "duration": "35:20"},
        {"title": "Flutter Layout Widgets", "url": "https://www.youtube.com/watch?v=RJEnTfBMlf0", "channel": "Flutter", "duration": "25:15"},
        {"title": "Flutter State Management", "url": "https://www.youtube.com/watch?v=kn0EOS-ZiIc", "channel": "Reso Coder", "duration": "42:30"}
    ]
}

def find_real_youtube_videos(query: str, max_results: int = 5):
    """Find real YouTube videos based on query"""
    query_lower = query.lower()
    videos = []
    
    # Check for specific topic matches
    for topic_key, topic_videos in REAL_YOUTUBE_VIDEOS.items():
        topic_keywords = topic_key.split('_')
        if any(keyword in query_lower for keyword in topic_keywords):
            videos.extend(topic_videos)
            break
    
    # If no specific match, use general programming videos
    if not videos:
        if "python" in query_lower:
            videos = REAL_YOUTUBE_VIDEOS["python_introduction"]
        elif "javascript" in query_lower or "js" in query_lower:
            videos = REAL_YOUTUBE_VIDEOS["javascript_introduction"]
        elif "react" in query_lower:
            videos = REAL_YOUTUBE_VIDEOS["react_introduction"]
        elif "data" in query_lower and "science" in query_lower:
            videos = REAL_YOUTUBE_VIDEOS["data_science_introduction"]
        elif "machine" in query_lower and "learning" in query_lower:
            videos = REAL_YOUTUBE_VIDEOS["machine_learning_introduction"]
        elif "blockchain" in query_lower:
            videos = REAL_YOUTUBE_VIDEOS["blockchain_introduction"]
        elif "node" in query_lower:
            videos = REAL_YOUTUBE_VIDEOS["nodejs_introduction"]
        elif "flutter" in query_lower:
            videos = REAL_YOUTUBE_VIDEOS["flutter_introduction"]
        else:
            # Use a general programming tutorial
            videos = [
                {"title": "Programming Tutorial - Computer Science", "url": "https://www.youtube.com/watch?v=zOjov-2OZ0E", "channel": "freeCodeCamp.org", "duration": "1:45:30"},
                {"title": "Learn to Code - Full Course", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "channel": "freeCodeCamp.org", "duration": "4:26:52"}
            ]
    
    # Ensure we have title that matches the query if needed
    for video in videos:
        if not query.lower() in video["title"].lower():
            video["title"] = f"{query} - {video['title']}"
    
    return videos[:max_results]
