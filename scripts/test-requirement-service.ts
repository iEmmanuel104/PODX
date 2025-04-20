import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Types } from 'mongoose';
import { Call } from '../src/models/Mongodb/call.model';
import { User } from '../src/models/Mongodb/user.model';
import RequirementService from '../src/services/requirement.service';
import { logger } from '../src/utils/logger';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectToMongoDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/podx-test';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create dummy users
const createDummyUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({ walletAddress: { $regex: /^test-/ } });
    
    const users = await Promise.all([
      User.create({
        walletAddress: 'test-wallet-alice',
        username: 'alice_test',
      }),
      User.create({
        walletAddress: 'test-wallet-bob',
        username: 'bob_test',
      }),
      User.create({
        walletAddress: 'test-wallet-charlie',
        username: 'charlie_test',
      })
    ]);
    
    console.log(`Created ${users.length} dummy users`);
    return users;
  } catch (error) {
    console.error('Error creating dummy users:', error);
    throw error;
  }
};

// Create a dummy call with participants and events
const createDummyCall = async (users: any[]) => {
  try {
    // Clean up test calls
    await Call.deleteMany({ roomId: 'test-room-id' });
    
    // Get user IDs
    const [alice, bob, charlie] = users;
    
    // Create a call that started 1 hour ago and ended 5 minutes ago
    const startTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const endTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const totalDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000); // Duration in seconds
    
    // Calculate join/leave events for each user
    const aliceEvents = [
      { userId: alice._id, type: 'joined', timestamp: new Date(startTime.getTime()).toISOString(), walletAddress: alice.walletAddress },
      { userId: alice._id, type: 'left', timestamp: new Date(startTime.getTime() + 50 * 60 * 1000).toISOString(), walletAddress: alice.walletAddress }, // Stayed for 50 minutes
    ];
    
    const bobEvents = [
      { userId: bob._id, type: 'joined', timestamp: new Date(startTime.getTime() + 5 * 60 * 1000).toISOString(), walletAddress: bob.walletAddress }, // Joined 5 minutes after start
      { userId: bob._id, type: 'left', timestamp: new Date(startTime.getTime() + 15 * 60 * 1000).toISOString(), walletAddress: bob.walletAddress }, // Left after 10 minutes
      { userId: bob._id, type: 'joined', timestamp: new Date(startTime.getTime() + 20 * 60 * 1000).toISOString(), walletAddress: bob.walletAddress }, // Rejoined 5 minutes later
      { userId: bob._id, type: 'left', timestamp: new Date(endTime).toISOString(), walletAddress: bob.walletAddress }, // Stayed until the end
    ];
    
    const charlieEvents = [
      { userId: charlie._id, type: 'joined', timestamp: new Date(startTime.getTime() + 10 * 60 * 1000).toISOString(), walletAddress: charlie.walletAddress }, // Joined 10 minutes after start
      { userId: charlie._id, type: 'left', timestamp: new Date(startTime.getTime() + 12 * 60 * 1000).toISOString(), walletAddress: charlie.walletAddress }, // Left after 2 minutes
      { userId: charlie._id, type: 'joined', timestamp: new Date(startTime.getTime() + 13 * 60 * 1000).toISOString(), walletAddress: charlie.walletAddress }, // Quick rejoin (should be considered the same session)
      { userId: charlie._id, type: 'left', timestamp: new Date(startTime.getTime() + 25 * 60 * 1000).toISOString(), walletAddress: charlie.walletAddress }, // Left after 12 more minutes
    ];
    
    // Create the call with 70% duration requirement
    const call = await Call.create({
      roomId: 'test-room-id',
      title: 'Test Meeting',
      description: 'A test meeting to validate the RequirementService',
      type: 'video',
      hostWalletAddress: alice.walletAddress,
      createdById: alice._id,
      status: 'ended',
      startedAt: startTime,
      endedAt: endTime,
      duration: totalDuration,
      isActive: false,
      members: [
        { userId: alice._id, role: 'host' },
        { userId: bob._id, role: 'guest' },
        { userId: charlie._id, role: 'guest' }
      ],
      custom: {
        durationRequirement: {
          value: 70, // 70% requirement
          type: 'percentage'
        },
        events: [
          ...aliceEvents,
          ...bobEvents,
          ...charlieEvents
        ]
      }
    });
    
    console.log(`Created test call with ID: ${call.id} and roomId: ${call.roomId}`);
    return call;
  } catch (error) {
    console.error('Error creating dummy call:', error);
    throw error;
  }
};

// Test the RequirementService
const testRequirementService = async (roomId: string) => {
  try {
    console.log(`\nTESTING REQUIREMENT SERVICE FOR ROOM: ${roomId}\n`);
    
    // Get and display participant details
    console.log('-> Testing getParticipantDetails:');
    const participantDetails = await RequirementService.getParticipantDetails(roomId);
    console.log(JSON.stringify(participantDetails, null, 2));
    
    // Check minimum participants
    console.log('\n-> Testing checkMinParticipants:');
    const minParticipantsResult = await RequirementService.checkMinParticipants(roomId);
    console.log(JSON.stringify(minParticipantsResult, null, 2));
    
    // Check all requirements
    console.log('\n-> Testing checkAllRequirements:');
    const requirementsResult = await RequirementService.checkAllRequirements(roomId);
    console.log(JSON.stringify(requirementsResult, null, 2));
    
    // Print summary of who met the requirements
    console.log('\n======== SUMMARY ========');
    console.log(`Call duration: ${requirementsResult.details.callTimeSpentMinutes} minutes`);
    console.log(`Required duration: ${requirementsResult.details.requiredCallTimeMinutes} minutes (${requirementsResult.details.requiredCallTimeMinutes / requirementsResult.details.callTimeSpentMinutes * 100}%)`);
    console.log(`\nParticipant details:`);
    requirementsResult.details.participantDetails?.forEach(participant => {
      console.log(`- ${participant.username} (${participant.walletAddress})`);
      console.log(`  Time spent: ${participant.timeSpentMinutes} minutes`);
      console.log(`  Required: ${participant.requiredTimeMinutes} minutes`);
      console.log(`  Eligible: ${participant.eligible ? 'YES ✅' : 'NO ❌'}`);
      console.log('-------------------');
    });
    
    console.log(`\nOverall eligibility: ${requirementsResult.eligible ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log('========================');
    
    return requirementsResult;
  } catch (error) {
    console.error('Error testing RequirementService:', error);
    throw error;
  }
};

// Main function
async function main() {
  try {
    await connectToMongoDB();
    
    const users = await createDummyUsers();
    const call = await createDummyCall(users);
    
    // Test the RequirementService
    await testRequirementService(call.roomId);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
main(); 