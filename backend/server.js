const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const client = new MongoClient(mongoUri);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
    }
}
connectToDatabase();

app.get("/", (req, res) => {
    res.send("Welcome to the Node.js MongoDB API!");
});

//Vision and Mission
app.get('/api/department/:id', async (req, res) => {
    const departmentId = parseInt(req.params.id); 
    const db = client.db(dbName);
    const collection = db.collection('vision_and_mission');

    try {
        const result = await collection.findOne({ department_id: departmentId });
        if (result) {
            res.json(result);
        } else {
            res.status(404).json({ error: "Department not found" });
        }
    } catch (error) {
        console.error("❌ Error fetching department data:", error);
        res.status(500).json({ error: "Error fetching data" });
    }
});

// Head Of Department Details
app.get('/api/hod/:department_id', async (req, res) => {
    const departmentId = req.params.department_id;
    const db = client.db(dbName);
    const hodsCollection = db.collection('HODS');

    try {
        const hod = await hodsCollection.findOne({
            Unique_id: { $regex: `VEC-${departmentId}-` }
        });

        if (hod) {
            res.json({
                Name: hod.Name,
                Unique_id: hod.Unique_id,
                Qualification: hod.Qualification,
                Hod_message: hod.Hod_message,
                designation:hod.designation,
                Image: hod.Image,
                Social_media_links: hod.Social_media_links
            });
        } else {
            res.status(404).json({ error: "HOD not found for this department." });
        }
    } catch (error) {
        console.error("❌ Error fetching HOD details:", error);
        res.status(500).json({ error: "Error fetching HOD details" });
    }
});

//Staff Details
app.get('/api/staff/:deptId', async (req, res) => {
    const deptId = req.params.deptId;
    const db = client.db(dbName);
    const collection = db.collection('staff_details');

    try {
        const staffDetails = await collection.find(
            { unique_id: { $regex: `^VEC-${deptId}-` } }, 
            {
                projection: {
                    Name: 1,
                    Designation: 1,
                    Photo: 1,
                    "Google Scholar Profile": 1,
                    "Research Gate": 1,
                    "Orchid Profile": 1,
                    "Publon Profile": 1,
                    "Scopus Author Profile": 1,
                    "LinkedIn Profile": 1,
                    unique_id:1,
                    _id: 0, 
                }
            }
        ).toArray();

        if (staffDetails.length > 0) {
            res.status(200).json(staffDetails);
        } else {
            res.status(404).json({ message: 'No staff found for the given department ID.' });
        }
    } catch (error) {
        console.error("❌ Error fetching staff details:", error);
        res.status(500).json({ error: "Error fetching staff details" });
    }
});

//Infrastructure
app.get('/api/infrastructure/:deptId', async (req, res) => {
    const deptId = parseInt(req.params.deptId);
    const db = client.db(dbName);
    const collection = db.collection('infrastructure');

    try {
        const result = await collection.findOne({ dept_id: deptId });

        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ error: "No infrastructure details found for the given department ID." });
        }
    } catch (error) {
        console.error("Error fetching infrastructure details:", error);
        res.status(500).json({ error: "Error fetching infrastructure details" });
    }
});

//Student Records
app.get('/api/student-activities/:deptId', async (req, res) => {
    const deptId = parseInt(req.params.deptId);
    const db = client.db(dbName);
    const collection = db.collection('student_activities');

    try {
        const result = await collection.findOne({ dept_id: deptId });

        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ error: "No student activities found for the given department ID." });
        }
    } catch (error) {
        console.error("Error fetching student activities:", error);
        res.status(500).json({ error: "Error fetching student activities" });
    }
});

// Support Staff Details
app.get('/api/support-staff/:deptId', async (req, res) => {
    const deptId = req.params.deptId;
    const db = client.db(dbName);
    const collection = db.collection('support_staffs');

    try {
        const result = await collection.findOne({
            "supporting_staff.Unique_id": { $regex: `^VEC-${deptId}-` }
        });

        if (result && result.supporting_staff.length > 0) {
            const filteredStaff = result.supporting_staff.filter(staff =>
                staff.Unique_id.startsWith(`VEC-${deptId}-`)
            );
            res.status(200).json(filteredStaff);
        } else {
            res.status(404).json({ message: 'No support staff found for the given department ID.' });
        }
    } catch (error) {
        console.error("❌ Error fetching support staff details:", error);
        res.status(500).json({ error: "Error fetching support staff details" });
    }
});

// MOUs Details Endpoint
app.get('/api/mous/:deptId/:uniqueId?', async (req, res) => {
    const { deptId, uniqueId } = req.params;
    const db = client.db(dbName);
    const collection = db.collection('MOUs');

    try {
        const departmentData = await collection.findOne({
            "VEC.Departments": deptId
        });

        if (!departmentData) {
            return res.status(404).json({ message: "Department not found" });
        }

        const department = departmentData.VEC.find(dept => dept.Departments === deptId);

        if (!department) {
            return res.status(404).json({ message: "Department not found" });
        }
        if (uniqueId) {
            const filteredMOUs = department.MOUs.filter(mou =>
                mou.unique_id.toString() === uniqueId
            );

            if (filteredMOUs.length > 0) {
                return res.status(200).json(filteredMOUs);
            } else {
                return res.status(404).json({ message: "No MOU found with the provided unique_id or year." });
            }
        }
        const uniqueIdsList = department.MOUs.map(mou => mou.unique_id);
        return res.status(200).json({ unique_ids: uniqueIdsList });

    } catch (error) {
        console.error("❌ Error fetching MOUs:", error);
        res.status(500).json({ error: "Error fetching MOUs" });
    }
});

// Department Activities Endpoint
app.get('/api/department_activities/:deptId', async (req, res) => {
    const { deptId } = req.params;
    const db = client.db(dbName);
    const collection = db.collection('department_activities');

    try {
        const departmentData = await collection.findOne({ dept_id: deptId });

        if (!departmentData) {
            console.log("❌ Department not found for dept_id:", deptId);
            return res.status(404).json({ message: "Department not found" });
        }

        const sortedActivities = departmentData.dept_activities.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });

        return res.status(200).json(sortedActivities);

    } catch (error) {
        console.error("❌ Error fetching department activities:", error);
        res.status(500).json({ error: "Error fetching department activities" });
    }
});


// Curriculum 
app.get('/api/curriculum/:deptId', async (req, res) => {
    const { deptId } = req.params;
    const db = client.db(dbName);
    const collection = db.collection('curriculum');

    try {
        const departmentData = await collection.findOne({ dept_id: deptId });
        if (!departmentData) {
            return res.status(404).json({ message: "Department not found" });
        }
        res.status(200).json(departmentData);

    } catch (error) {
        console.error("❌ Error fetching curriculum data:", error);
        res.status(500).json({ error: "Error fetching curriculum data" });
    }
});

//Research Data
app.get('/api/fetch-research-data/:dept_id/:year', async (req, res) => {
    const { dept_id, year } = req.params;

    if (!dept_id || !year) {
        return res.status(400).json({ error: 'Both dept_id and year are required' });
    }

    const db = client.db(dbName);
    const collection = db.collection('research_data');

    try {
        const result = await collection.find({
            dept_id: dept_id,
            "data.data.year": year
        }).toArray();

        if (result.length === 0) {
            return res.status(404).json({ message: 'No research data found for the given department and year' });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error fetching research data:", error);
        res.status(500).json({ error: "Error fetching research data" });
    }
});

// Fetch Event Details
app.get('/api/events/active', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('events');

    try {
        const activeEvents = await collection.aggregate([
            { $unwind: "$events" },
            { $match: { "events.status": "True" } },
            { $replaceRoot: { newRoot: "$events" } }
        ]).toArray();

        if (activeEvents.length === 0) {
            return res.status(404).json({ message: "No active events found" });
        }

        res.status(200).json(activeEvents);

    } catch (error) {
        console.error("❌ Error fetching active events:", error);
        res.status(500).json({ error: "Error fetching active events" });
    }
});

// Fetch announcements
app.get('/api/announcements', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('announcements');

    try {
        const announcements = await collection.find({}).toArray();
        if (announcements.length === 0) {
            return res.status(404).json({ message: 'No announcements found' });
        }
        res.status(200).json(announcements);
    } catch (error) {
        console.error('❌ Error fetching announcements:', error);
        res.status(500).json({ error: 'Error fetching announcements' });
    }
});

// Fetch Special announcements
app.get('/api/special_announcements', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('special_announcement');

    try {
        const nominationDetails = await collection.find({}).toArray();
        if (nominationDetails.length === 0) {
            return res.status(404).json({ message: "No special_announcement details found" });
        }
        res.status(200).json(nominationDetails);
    } catch (error) {
        console.error("❌ Error fetching special_announcement details:", error);
        res.status(500).json({ error: "Error fetching special_announcement details" });
    }
});

// Fetch Principal Details
app.get('/api/principal', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('principal_data');

    try {
        const principalDetails = await collection.findOne({});
        if (!principalDetails) {
            return res.status(404).json({ message: "Principal details not found" });
        }
        res.status(200).json(principalDetails);
    } catch (error) {
        console.error("❌ Error fetching principal details:", error);
        res.status(500).json({ error: "Error fetching principal details" });
    }
});

//Admin Office
app.get('/api/admin_office', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('admin_office');

    try {
        const announcements = await collection.find({}).toArray();
        if (announcements.length === 0) {
            return res.status(404).json({ message: 'No announcements found' });
        }
        res.status(200).json(announcements);
    } catch (error) {
        console.error('❌ Error fetching announcements:', error);
        res.status(500).json({ error: 'Error fetching announcements' });
    }
});

//Committee
app.get('/api/committee', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('committee');

    try {
        const announcements = await collection.find({}).toArray();
        if (announcements.length === 0) {
            return res.status(404).json({ message: 'No announcements found' });
        }
        res.status(200).json(announcements);
    } catch (error) {
        console.error('❌ Error fetching announcements:', error);
        res.status(500).json({ error: 'Error fetching announcements' });
    }
});

//Regulations
app.get('/api/regulation', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('regulation');

    try {
        const announcements = await collection.find({}).toArray();
        if (announcements.length === 0) {
            return res.status(404).json({ message: 'No announcements found' });
        }
        res.status(200).json(announcements);
    } catch (error) {
        console.error('❌ Error fetching announcements:', error);
        res.status(500).json({ error: 'Error fetching announcements' });
    }
});

//Intakes
app.get('/api/intakes', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('Intakes'); // Use the collection for intake data

    try {
        const intakes = await collection.find({}).toArray(); // Fetch all intakes
        if (intakes.length === 0) {
            return res.status(404).json({ message: 'No intake data found' });
        }
        res.status(200).json(intakes); // Return the data as JSON
    } catch (error) {
        console.error('❌ Error fetching intakes:', error);
        res.status(500).json({ error: 'Error fetching intake data' });
    }
});

// Placement Team
app.get('/api/placement_team', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('placement_team');

    try {
        const placementTeam = await collection.find({}).toArray();
        if (placementTeam.length === 0) {
            return res.status(404).json({ message: 'No placement team data found' });
        }
        res.status(200).json(placementTeam);
    } catch (error) {
        console.error('❌ Error fetching placement team data:', error);
        res.status(500).json({ error: 'Error fetching placement team data' });
    }
});

//dean_and_associates
app.get('/api/dean_and_associates', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('dean_and_associates');

    try {
        const deansData = await collection.find({}).toArray();
        if (deansData.length === 0) {
            return res.status(404).json({ message: 'No deans data found' });
        }
        res.status(200).json(deansData);
    } catch (error) {
        console.error('❌ Error fetching deans data:', error);
        res.status(500).json({ error: 'Error fetching deans data' });
    }
});

//Placements Data
app.get('/api/placements_data', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('placements_data');

    try {
        const announcements = await collection.find({}).toArray();
        if (announcements.length === 0) {
            return res.status(404).json({ message: 'No announcements found' });
        }
        res.status(200).json(announcements);
    } catch (error) {
        console.error('❌ Error fetching announcements:', error);
        res.status(500).json({ error: 'Error fetching announcements' });
    }
});

//all_forms
app.get('/api/all_forms', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('all_forms');

    try {
        const announcements = await collection.find({}).toArray();
        if (announcements.length === 0) {
            return res.status(404).json({ message: 'No announcements found' });
        }
        res.status(200).json(announcements);
    } catch (error) {
        console.error('❌ Error fetching announcements:', error);
        res.status(500).json({ error: 'Error fetching announcements' });
    }
});

//curriculum_and_syllabus
app.get('/api/curriculum_and_syllabus', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('curriculum_and_syllabus');

    try {
        const announcements = await collection.find({}).toArray();
        if (announcements.length === 0) {
            return res.status(404).json({ message: 'No curriculum or syllabus found' });
        }
        res.status(200).json(announcements);
    } catch (error) {
        console.error('❌ Error fetching curriculum and syllabus', error);
        res.status(500).json({ error: 'Error fetching curriculum and syllabus' });
    }
});

//alumni
app.get('/api/alumni', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('alumni');

    try {
        const alumniData = await collection.find({}).toArray();
        if (alumniData.length === 0) {
            return res.status(404).json({ message: 'No alumni data found' });
        }
        res.status(200).json(alumniData);
    } catch (error) {
        console.error('❌ Error fetching alumni data:', error);
        res.status(500).json({ error: 'Error fetching alumni data' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});