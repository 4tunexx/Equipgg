# Project TODOs

## UI Components
- [x] Fix UI component path resolution in Vercel deployment
- [ ] Implement responsive design for mobile users
- [ ] Add dark mode support

## Authentication
- [x] Fix auth-provider import issue
- [ ] Improve error handling in sign-in process
- [ ] Implement password reset functionality
- [ ] Add email verification flow

## Database Integration
- [ ] Move temporary data structures to Supabase (from src/app/dashboard/admin/page.tsx)
- [ ] Implement API for user stats in Supabase (from src/app/api/user/stats/route.ts)
- [ ] Move feature highlights data to database (from src/components/landing/feature-highlights.tsx)
- [ ] Move betting history data to Supabase (from src/components/profile/betting-history.tsx)

## Game Features
- [ ] Implement proper provably fair verification (from src/lib/provablyFair.ts)
- [ ] Implement mission tracking with Supabase (from src/lib/mission-tracker.ts)
- [ ] Implement achievement tracking with Supabase (from src/lib/achievement-tracker.ts)
- [ ] Implement PandaScore integration (from src/lib/pandascore.ts)
- [ ] Implement HLTV odds syncing (from src/lib/hltv-scraper.ts)

## Performance & Security
- [ ] Optimize loading time for inventory items
- [ ] Implement rate limiting for API endpoints
- [ ] Add comprehensive error logging
- [ ] Set up monitoring for critical API endpoints

## Testing
- [ ] Add unit tests for critical components
- [ ] Set up integration tests for authentication flow
- [ ] Implement end-to-end testing for core user journeys

## Deployment
- [x] Fix Vercel build issues with UI components
- [ ] Set up CI/CD pipeline for automated testing
- [ ] Configure environment variables for production deployment
- [ ] Document deployment process for team members

## Documentation
- [ ] Create API documentation
- [ ] Update README with setup instructions
- [ ] Document authentication flow
- [ ] Create developer onboarding guide