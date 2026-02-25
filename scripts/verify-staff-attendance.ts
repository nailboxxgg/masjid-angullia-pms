import fs from 'fs';

console.log("Current working directory:", process.cwd());

// Manually load .env.local
try {
    const envPath = 'a:\\Projects\\masjid-angullia-pms\\.env.local'; // Hardcoded for certainty in this test script
    console.log("Attempting to load env from:", envPath);
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                const cleanKey = key.trim();
                const cleanValue = value.trim().replace(/"/g, '');
                process.env[cleanKey] = cleanValue;
            }
        });
        console.log("Environment variables loaded.");
    } else {
        console.error("❌ .env.local file not found at", envPath);
    }
} catch (e) {
    console.error("Error loading .env.local", e);
}

// import { createStaff, getStaffList, clockInStaff, clockOutStaff, deleteStaff } from "@/lib/staff";

async function verifyStaffAttendance() {
    // Dynamic import to ensure env vars are loaded first
    const { createStaff, getStaffList, clockInStaff, clockOutStaff, deleteStaff } = await import("@/lib/staff");

    console.log("Starting Staff Attendance Verification...");

    // 1. Create a Test Staff
    console.log("\n1. Creating Test Staff...");
    const testStaffIds: string[] = [];

    // Create staff without ID (should auto-generate)
    const success = await createStaff({
        name: "Test User 1",
        role: "staff",
        contactNumber: "09171234567",
        address: "123 Test St",
        email: "test1@example.com",
        department: "IT"
    });

    if (success) {
        console.log("✅ Staff creation successful.");
    } else {
        console.error("❌ Staff creation failed.");
        return;
    }

    // 2. Retrieve Staff to get ID
    console.log("\n2. Retrieving Staff List...");
    const staffList = await getStaffList();
    const testStaff = staffList.find(s => s.name === "Test User 1");

    if (testStaff) {
        console.log(`✅ Staff found: ${testStaff.name} (ID: ${testStaff.id})`);
        testStaffIds.push(testStaff.id);
    } else {
        console.error("❌ Test staff not found in list.");
        return;
    }

    const staffId = testStaffIds[0];

    // 3. Test Clock In
    console.log(`\n3. Testing Clock In for ${staffId}...`);
    const clockInResult = await clockInStaff(staffId);
    if (clockInResult.success) {
        console.log(`✅ Clock In Successful: ${clockInResult.message}`);
    } else {
        console.error(`❌ Clock In Failed: ${clockInResult.message}`);
    }

    // 4. Test Duplicate Clock In
    console.log(`\n4. Testing Duplicate Clock In for ${staffId}...`);
    const duplicateIdResult = await clockInStaff(staffId);
    if (!duplicateIdResult.success && duplicateIdResult.message.includes("already")) {
        console.log(`✅ Duplicate Clock In correctly prevented: ${duplicateIdResult.message}`);
    } else {
        console.error(`❌ Duplicate Clock In check failed: ${duplicateIdResult.message}`);
    }

    // 5. Test Clock Out
    console.log(`\n5. Testing Clock Out for ${staffId}...`);
    // Simulate some time passing? (Not possible in script really without wait, but logic holds)
    const clockOutResult = await clockOutStaff(staffId);
    if (clockOutResult.success) {
        console.log(`✅ Clock Out Successful: ${clockOutResult.message}`);
    } else {
        console.error(`❌ Clock Out Failed: ${clockOutResult.message}`);
    }

    // 6. Test Clock Out without Clock In
    console.log(`\n6. Testing Clock Out without Clock In for ${staffId}...`);
    const invalidClockOutResult = await clockOutStaff(staffId);
    if (!invalidClockOutResult.success) {
        console.log(`✅ Invalid Clock Out correctly prevented: ${invalidClockOutResult.message}`);
    } else {
        console.error(`❌ Invalid Clock Out check failed.`);
    }

    // 7. Clean up
    console.log("\n7. Cleaning up test data...");
    for (const id of testStaffIds) {
        await deleteStaff(id);
        console.log(`Deleted staff ${id}`);
    }

    console.log("\nVerification Complete.");
}

// Execute logic
verifyStaffAttendance().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
