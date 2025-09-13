#!/usr/bin/env python3
"""
Seed sample achievements into the database for testing
"""
import asyncio
import sys
import os
from datetime import datetime, timezone
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from digital_twin.models.quiz_achievement import Achievement, AchievementType, AchievementTier, AchievementCriteria
from digital_twin.config.database import connect_to_mongo, close_mongo_connection


class AchievementSeeder:
    def __init__(self):
        self.sample_achievements = [
            {
                "title": "First Steps",
                "description": "Complete your first lesson to begin your learning journey",
                "achievement_type": AchievementType.COURSE_COMPLETION,
                "tier": AchievementTier.BRONZE,
                "category": "learning",
                "badge_color": "#CD7F32",
                "criteria": {
                    "type": "lesson_completion",
                    "target_value": 1.0,
                    "comparison": "gte"
                },
                "points_reward": 10,
                "tags": ["beginner", "first"],
                "rarity": "common"
            },
            {
                "title": "Data Type Master",
                "description": "Demonstrated proficiency in using different data types and operators",
                "achievement_type": AchievementType.COURSE_COMPLETION,
                "tier": AchievementTier.BRONZE,
                "category": "learning",
                "badge_color": "#CD7F32",
                "criteria": {
                    "type": "course_completion",
                    "target_value": 1.0,
                    "comparison": "gte"
                },
                "points_reward": 10,
                "tags": ["programming", "fundamentals"],
                "rarity": "common"
            },
            {
                "title": "Quiz Master",
                "description": "Score 90% or higher on course quizzes",
                "achievement_type": AchievementType.QUIZ_MASTERY,
                "tier": AchievementTier.SILVER,
                "category": "assessment",
                "badge_color": "#C0C0C0",
                "criteria": {
                    "type": "quiz_score",
                    "target_value": 90.0,
                    "comparison": "gte"
                },
                "points_reward": 25,
                "tags": ["quiz", "excellence"],
                "rarity": "uncommon"
            },
            {
                "title": "Speed Learner",
                "description": "Complete lessons quickly and efficiently",
                "achievement_type": AchievementType.SPEED,
                "tier": AchievementTier.SILVER,
                "category": "performance",
                "badge_color": "#C0C0C0",
                "criteria": {
                    "type": "lesson_speed",
                    "target_value": 5.0,
                    "comparison": "lte"
                },
                "points_reward": 30,
                "tags": ["speed", "efficiency"],
                "rarity": "uncommon"
            },
            {
                "title": "Perfectionist",
                "description": "Achieve perfect scores on multiple assessments",
                "achievement_type": AchievementType.PERFECTIONIST,
                "tier": AchievementTier.GOLD,
                "category": "excellence",
                "badge_color": "#FFD700",
                "criteria": {
                    "type": "perfect_scores",
                    "target_value": 3.0,
                    "comparison": "gte"
                },
                "points_reward": 50,
                "tags": ["perfection", "mastery"],
                "rarity": "rare"
            },
            {
                "title": "Dedicated Learner",
                "description": "Maintain a consistent learning streak",
                "achievement_type": AchievementType.DEDICATION,
                "tier": AchievementTier.GOLD,
                "category": "consistency",
                "badge_color": "#FFD700",
                "criteria": {
                    "type": "learning_streak",
                    "target_value": 7.0,
                    "comparison": "gte"
                },
                "points_reward": 40,
                "tags": ["dedication", "consistency"],
                "rarity": "rare"
            },
            {
                "title": "Course Explorer",
                "description": "Explore and enroll in multiple courses",
                "achievement_type": AchievementType.EXPLORER,
                "tier": AchievementTier.PLATINUM,
                "category": "exploration",
                "badge_color": "#E5E4E2",
                "criteria": {
                    "type": "course_enrollment",
                    "target_value": 3.0,
                    "comparison": "gte"
                },
                "points_reward": 75,
                "tags": ["exploration", "curiosity"],
                "rarity": "epic"
            },
            {
                "title": "Module Master",
                "description": "Complete all modules in a course",
                "achievement_type": AchievementType.MODULE_COMPLETION,
                "tier": AchievementTier.PLATINUM,
                "category": "completion",
                "badge_color": "#E5E4E2",
                "criteria": {
                    "type": "module_completion",
                    "target_value": 100.0,
                    "comparison": "gte"
                },
                "points_reward": 100,
                "tags": ["modules", "completion"],
                "rarity": "epic"
            },
            {
                "title": "Knowledge Seeker",
                "description": "Complete 5 courses across different subjects",
                "achievement_type": AchievementType.COURSE_COMPLETION,
                "tier": AchievementTier.PLATINUM,
                "category": "learning",
                "badge_color": "#E5E4E2",
                "criteria": {
                    "type": "course_completion",
                    "target_value": 5.0,
                    "comparison": "gte"
                },
                "points_reward": 150,
                "tags": ["knowledge", "mastery"],
                "rarity": "legendary"
            },
            {
                "title": "Streak Champion",
                "description": "Maintain a 30-day learning streak",
                "achievement_type": AchievementType.STREAK,
                "tier": AchievementTier.PLATINUM,
                "category": "consistency",
                "badge_color": "#E5E4E2",
                "criteria": {
                    "type": "learning_streak",
                    "target_value": 30.0,
                    "comparison": "gte"
                },
                "points_reward": 200,
                "tags": ["streak", "champion"],
                "rarity": "legendary"
            }
        ]

    async def seed_achievements(self):
        """Seed sample achievements into the database"""
        print("🌱 Starting achievement seeding...")
        
        # Check existing achievements
        existing_count = await Achievement.find({}).count()
        print(f"📊 Current achievements in database: {existing_count}")
        
        created_count = 0
        for ach_data in self.sample_achievements:
            # Generate achievement ID
            achievement_id = f"sample_{ach_data['title'].lower().replace(' ', '_')}"
            
            # Check if achievement already exists
            existing = await Achievement.find_one({"achievement_id": achievement_id})
            if existing:
                print(f"⏭️  Achievement already exists: {ach_data['title']}")
                continue
            
            # Create criteria object
            criteria = AchievementCriteria(**ach_data["criteria"])
            
            # Create achievement
            achievement = Achievement(
                achievement_id=achievement_id,
                title=ach_data["title"],
                description=ach_data["description"],
                achievement_type=ach_data["achievement_type"],
                tier=ach_data["tier"],
                category=ach_data["category"],
                badge_color=ach_data["badge_color"],
                criteria=criteria,
                points_reward=ach_data["points_reward"],
                created_by="did:learntwin:seed_script",
                tags=ach_data["tags"],
                rarity=ach_data["rarity"],
                status="active"
            )
            
            await achievement.insert()
            created_count += 1
            print(f"✅ Created achievement: {achievement.title} ({achievement.tier.value})")
        
        final_count = await Achievement.find({}).count()
        print(f"🎯 Achievement seeding completed!")
        print(f"📈 Total achievements in database: {final_count}")
        print(f"🆕 New achievements created: {created_count}")


async def main():
    """Main seeding function"""
    try:
        # Connect to database
        await connect_to_mongo()
        print("✅ Connected to MongoDB")
        
        # Seed achievements
        seeder = AchievementSeeder()
        await seeder.seed_achievements()
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        # Close database connection
        await close_mongo_connection()
        print("🔐 Database connection closed")


if __name__ == "__main__":
    asyncio.run(main())
