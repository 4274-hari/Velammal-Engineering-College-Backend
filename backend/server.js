const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;
app.use(bodyParser.json());

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

//faculty_details
app.get('/api/faculty_details/:dept_id', async (req, res) => {
    const deptId = req.params.dept_id;
    const db = client.db(dbName);
    const collection = db.collection('faculty_data');

    try {
        const staffDetails = await collection.findOne({ dept_id: deptId });

        if (staffDetails) {
            res.status(200).json(staffDetails);
        } else {
            res.status(404).json({ message: 'No staff details found for the given department ID.' });
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
            Departments: deptId
        });
        if (!departmentData) {
            return res.status(404).json({ message: "Department not found" });
        }

        const departmentMOUs = departmentData.MOUs;

        if (uniqueId) {
            const filteredMOUs = departmentMOUs.filter(mou =>
                mou.unique_id.toString() === uniqueId
            );

            if (filteredMOUs.length > 0) {
                return res.status(200).json(filteredMOUs);
            } else {
                return res.status(404).json({ message: "No MOU found with the provided unique_id or year." });
            }
        }

        const uniqueIdsList = departmentMOUs.map(mou => mou.unique_id);
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

// Fetch Recent 5 Events
app.get('/api/events/recent', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('events');

    try {
        const recentEvents = await collection.aggregate([
            { $unwind: "$events" },
            { $sort: { "events.date": -1 } },
            { $limit: 10 },
            { $replaceRoot: { newRoot: "$events" } }
        ]).toArray();

        if (recentEvents.length === 0) {
            return res.status(404).json({ message: "No events found" });
        }

        res.status(200).json(recentEvents);

    } catch (error) {
        console.error("❌ Error fetching recent events:", error);
        res.status(500).json({ error: "Error fetching recent events" });
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

// Endpoint to fetch details for UG and UG_Lateral
app.get('/api/ug_and_ug_lateral', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('Intakes');

    try {
        const data = await collection.findOne({}, { projection: { UG: 1, UG_Lateral: 1, _id: 0 } });
        if (!data) {
            return res.status(404).json({ message: 'No UG and UG_Lateral details found' });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error('❌ Error fetching UG and UG_Lateral details:', error);
        res.status(500).json({ error: 'Error fetching UG and UG_Lateral details' });
    }
});

// Endpoint to fetch details for PG
app.get('/api/pg', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('Intakes');

    try {
        const data = await collection.findOne({}, { projection: { PG: 1, _id: 0 } });
        if (!data) {
            return res.status(404).json({ message: 'No PG details found' });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error('❌ Error fetching PG details:', error);
        res.status(500).json({ error: 'Error fetching PG details' });
    }
});

// Endpoint to fetch details for MBA
app.get('/api/mba', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('Intakes');

    try {
        const data = await collection.findOne({}, { projection: { MBA: 1, _id: 0 } });
        if (!data) {
            return res.status(404).json({ message: 'No MBA details found' });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error('❌ Error fetching MBA details:', error);
        res.status(500).json({ error: 'Error fetching MBA details' });
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

//banner
app.get('/api/banner', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('banner');

    try {
        const bannersData = await collection.find({}).toArray();
        if (bannersData.length === 0) {
            return res.status(404).json({ message: 'No banners found' });
        }
        res.status(200).json(bannersData);
    } catch (error) {
        console.error('❌ Error fetching banners:', error);
        res.status(500).json({ error: 'Error fetching banners' });
    }
});

//Staff Details
app.get('/api/staff_details/:unique_id', async (req, res) => {
    try {
        const db = client.db(dbName);
        const collection = db.collection('staff_details');
        const uniqueId = req.params.unique_id;

        const facultyData = await collection.findOne({ unique_id: uniqueId });

        if (!facultyData) {
            return res.status(404).json({ message: 'Faculty data not found' });
        }
        const convertedData = {
            "_id": facultyData["unique_id"], 
            "Name": facultyData["Name"],
            "Surname": facultyData["Initial or Surname"],
            "Designation": facultyData["Designation"],
            "Joined_in": facultyData["Joined in"],
            "Department_Name": facultyData["Department Name"],
            "Mail_ID": facultyData["Mail ID"],
            "Photo": `/static/images/profile_photos/${facultyData["unique_id"]}.jpg`,
            "Google_Scholar_Profile": facultyData["Google Scholar Profile"],
            "Research_Gate": facultyData["Research Gate"],
            "Orchid_Profile": facultyData["Orchid Profile"] || null,
            "Publon_Profile": facultyData["Publon Profile"] || null,
            "Scopus_Author_Profile": facultyData["Scopus Author Profile"],
            "LinkedIn_Profile": facultyData["LinkedIn Profile"],
            "Professional_Membership": facultyData["Professional Membership"] || null,
            "Sponsored_Projects": facultyData["Sponsored Projects"],
            "Patent_Granted": facultyData["Patent Granted"],
            "Patent_Published": facultyData["Patent Published"],
            "Patent_Filed": facultyData["Patent Filed"] || null,
            "Journal_Publications": facultyData["Journal Publications"],
            "Conference_Publications": facultyData["Conference Publications"],
            "Book_Chapter_Published": facultyData["Book Chapter Published"],
            "Guest_Lectures_Delivered": facultyData["Guest Lectures Delivered"],
            "Guest_Lectures_Attended": facultyData["Guest Lectures Attended"] || null,
            "Guest_Lectures_Organized": facultyData["Guest Lectures Organized"],
            "PHD_Produced": facultyData["PHD Produced"] || null,
            "PHD_Pursuing": facultyData["PHD Pursuing"] || null,
            "Upload_Your_Excel_File_Here": facultyData["Upload Your Excel File Here"],
            "unique_id": facultyData["unique_id"],
            "EDUCATIONAL_QUALIFICATION": facultyData["EDUCATIONAL_QUALIFICATION"].map(qual => ({
                "DEGREE": qual["DEGREE"],
                "BRANCH": qual["BRANCH"],
                "INSTITUTE": qual["INSTITUTE"],
                "YEAR": qual["YEAR"]
            })),
            "EXPERIENCE": facultyData["EXPERIENCE"]
                .filter(exp => exp.DURATION !== "From")
                .map(exp => ({
                    "From": exp["DURATION"] === "TOTAL" ? null : exp["DURATION"],
                    "TO": exp["Unnamed:_1"] === "TO" ? null : exp["Unnamed:_1"],
                    "YEARS": exp["EXPERIENCE"] === "NO.OF.YEARS" || exp["EXPERIENCE"] === "-" ? null : exp["EXPERIENCE"],
                    "MONTHS": exp["Unnamed:_3"] === "NO.OF MONTHS" || exp["Unnamed:_3"] === "-" ? null : exp["Unnamed:_3"],
                    "DESIGNATION": exp["DESIGNATION"] || null,
                    "INSTITUTION": exp["INSTITUTION"] || null
                })),
            "CONFERENCE_PUBLICATIONS": facultyData["CONFERENCE_PUBLICATIONS"].map(pub => ({
                "AUTHORS": pub["AUTHORS"],
                "PAPER_TITLE": pub["PAPER_TITLE"],
                "CONFERENCE_NAME": pub["CONFERENCE_NAME"],
                "ORGANIZED_BY": pub["ORGANIZED_BY"],
                "book_number": pub["book_number"] || "-",
                "MONTH_&YEAR": pub["MONTH&_YEAR"]
            })),
            "BOOK_PUBLICATIONS": facultyData["BOOK_PUBLICATIONS"].map(pub => ({
                "AUTHOR": pub["AUTHOR"],
                "BOOK_NAME,_EDITION": pub["BOOK_NAME,_EDITION"],
                "PUBLISHER": pub["PUBLISHER"],
                "ISBN_/ISSN_NO": pub["ISBN/_ISSN_NO"],
                "MONTH_&YEAR": pub["MONTH&_YEAR"],
                "BOOK": pub["BOOK"]
            })),
            "PATENTS": facultyData["PATENTS"] || [],
            "PROJECTS": facultyData["PROJECTS"].map(project => ({
                "TITLE": project["TITLE"],
                "SPONSORING_AGENCY": project["SPONSORING_AGENCY"],
                "AMOUNT": project["AMOUNT"],
                "YEAR_OF_SANCTION": project["YEAR_OF_SANCTION"],
                "DURATION": project["DURATION"],
                "RESPONSIBILITY": project["RESPONSIBILITY"],
                "STATUS": project["STATUS"]
            })),
            "JOURNAL_PUBLICATIONS": facultyData["JOURNAL_PUBLICATIONS"].map(pub => ({
                "AUTHORS": pub["AUTHORS"],
                "PAPER_TITLE": pub["PAPER_TITLE"],
                "JOURNAL_NAME": pub["JOURNAL_NAME"],
                "DOI_NUMBER": pub["DOI_NUMBER"],
                "PAGE_NO": pub["PAGE_NO"] || "-",
                "VOL_NO": pub["VOL_NO"] || "-",
                "MONTH_&YEAR": pub["MONTH&_YEAR"],
                "INDEXED": pub["INDEXED"]
            })),
            "RESEARCH_SCHOLARS": facultyData["RESEARCH_SCHOLARS"] || []
        };
        res.json(convertedData);
    } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
        res.status(500).json({ message: 'Error fetching faculty data' });
    } finally {
        await client.close();
    }
});

//NBA
app.get('/api/nba', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('nba');

    try {
        const alumniData = await collection.find({}).toArray();
        if (alumniData.length === 0) {
            return res.status(404).json({ message: 'No nba data found' });
        }
        res.status(200).json(alumniData);
    } catch (error) {
        console.error('❌ Error fetching alumni data:', error);
        res.status(500).json({ error: 'Error fetching nba data' });
    }
});

//NAAC
app.get('/api/naac', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('naac');
    try {
        const NAACData = await collection.find({}).toArray();
        if (NAACData.length === 0) {
            return res.status(404).json({ message: 'No NAAC data found' });
        }
        res.status(200).json(NAACData);
    } catch (error) {
        console.error('❌ Error fetching NAAC data:', error);
        res.status(500).json({ error: 'Error fetching NAAC data' });
    }
});

//NIRF
app.get('/api/nirf', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('nirf');
    try {
        const NIRFData = await collection.find({}).toArray();
        if (NIRFData.length === 0) {
            return res.status(404).json({ message: 'No NIRF data found' });
        }
        res.status(200).json(NIRFData);
    } catch (error) {
        console.error('❌ Error fetching NIRF data:', error);
        res.status(500).json({ error: 'Error fetching NIRF data' });
    }
});

//iic contents
app.get('/api/iic', async (req, res) => {
    try {
        const db = client.db(dbName);
        const collection = db.collection('iic');

        const data = await collection.findOne({}); 

        if (!data) {
            return res.status(404).json({ message: "No data found" });
        }

        res.json(data); 
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

//Sidebar 
app.get('/api/sidebar/:deptid', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('sidebar');
    const deptid = req.params.deptid;

    try {
        // Find the document that matches the given deptid
        const departmentData = await collection.findOne({ deptId: deptid });

        // Check if the department exists
        if (!departmentData) {
            return res.status(404).json({ message: `No data found for deptId: ${deptid}` });
        }

        // Send the matched department data
        res.status(200).json(departmentData);
    } catch (error) {
        console.error('❌ Error fetching department data:', error);
        res.status(500).json({ error: 'Error fetching department data' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});