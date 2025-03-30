# Wheel of Meals Leveling System

## Overview
The Wheel of Meals leveling system is designed to reward users for their engagement and contributions to the community. As users interact with the platform by creating recipes, receiving likes, and engaging with others, they earn experience points (XP) that help them progress through various culinary ranks.

## Level Progression

### Experience Points (XP)
Users can earn XP through various actions:
- Creating a new recipe post: 50 XP
- Receiving a like on your recipe: 10 XP
- Receiving a comment on your recipe: 15 XP
- Commenting on others' recipes: 5 XP

### Ranks and Divisions
Each rank (except Michelin Star) has 4 divisions to progress through, creating more granular progression:

1. **Kitchen Novice** 👨‍🍳
   - Division 1: 0 XP
   - Reward: Basic recipe access

2. **Apprentice Chef** 🍳
   - Division 1: 100 XP
   - Division 2: 250 XP
   - Division 3: 500 XP
   - Division 4: 1,000 XP
   - Rewards: Custom recipe collections, sharing capabilities, meal planning, weekly highlights

3. **Home Cook** 🏠
   - Division 1: 2,000 XP
   - Division 2: 3,500 XP
   - Division 3: 5,000 XP
   - Division 4: 7,000 XP
   - Rewards: Recipe modification tools, ingredient substitutions, advanced filters, recipe scaling

4. **Culinary Enthusiast** 🌟
   - Division 1: 10,000 XP
   - Division 2: 15,000 XP
   - Division 3: 20,000 XP
   - Division 4: 30,000 XP
   - Rewards: Featured placement, custom collections, video uploads, premium templates

5. **Master Chef** 👑
   - Division 1: 50,000 XP
   - Division 2: 75,000 XP
   - Division 3: 100,000 XP
   - Division 4: 150,000 XP
   - Rewards: Recipe monetization, badge creation, live sessions, exclusive events

6. **Gourmet Guru** 🎖️
   - Division 1: 200,000 XP
   - Division 2: 300,000 XP
   - Rewards: Premium analytics, community challenges

7. **Michelin Star** ⭐
   - Single Division: 500,000 XP
   - Reward: Platform ambassador status

## Features

### Level Progress Display
- Current level title and icon
- Division number within the level
- Progress bar showing XP progress to next level
- Current XP and XP needed for next level
- List of current level rewards

### Automatic Level-ups
- System automatically calculates and updates levels based on XP
- No manual intervention needed
- Progress is saved and persists across sessions

### Rewards System
Each level unlocks new features and capabilities:
- Early levels focus on basic platform features
- Mid-levels unlock customization and advanced tools
- Higher levels grant exclusive privileges and recognition
- Special rewards for reaching milestone ranks

## Technical Implementation

### Database Structure
- `chef_levels` table stores all level definitions
- `user_profiles` tracks individual user progress
- Automatic triggers award XP for various actions

### XP Calculation
- Real-time XP awards through database triggers
- Automatic level calculation based on XP thresholds
- Progress percentage calculation for visual feedback

### Security
- Row Level Security (RLS) ensures data integrity
- Protected functions prevent XP manipulation
- Secure level progression tracking

## Tips for Leveling Up
1. Create and share original recipes regularly
2. Engage with the community by commenting on others' recipes
3. Create high-quality content that attracts likes and comments
4. Participate actively in the community to maximize XP gain
5. Focus on quality over quantity for sustainable growth

## Future Enhancements
- Seasonal events with bonus XP
- Special challenges for extra rewards
- Community competitions
- Achievement badges
- Specialized titles for specific accomplishments 