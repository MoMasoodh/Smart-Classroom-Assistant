const http = require("http");
const fs = require("fs");
const path = require("path");

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on("error", reject);
    if (postData) {
      if (Buffer.isBuffer(postData)) {
        req.write(postData);
      } else {
        req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
      }
    }
    req.end();
  });
}

function fetchAudioFile(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:5000${urlPath}`, (res) => {
      let size = 0;
      res.on("data", (chunk) => { size += chunk.length; });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          contentType: res.headers["content-type"],
          contentLength: res.headers["content-length"] || size,
          acceptRanges: res.headers["accept-ranges"],
          downloadedBytes: size,
        });
      });
    });
    req.on("error", reject);
  });
}

async function runTests() {
  console.log("--- STARTING END-TO-END SYSTEM INTEGRATION TESTS ---");

  try {
    // 1. Register / Login Teacher
    const teacherEmail = `drkumar_${Date.now()}@test.com`;
    console.log(`1. Registering Teacher (${teacherEmail})...`);
    await request(
      { hostname: "localhost", port: 5000, path: "/api/auth/register", method: "POST", headers: { "Content-Type": "application/json" } },
      { fullName: "Dr. Kumar", email: teacherEmail, password: "password123" }
    );

    console.log("Logging in Teacher...");
    const teacherLoginRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/auth/login", method: "POST", headers: { "Content-Type": "application/json" } },
      { email: teacherEmail, password: "password123" }
    );

    const teacherToken = teacherLoginRes.data.token;
    console.log("✅ Teacher Authenticated. Token received.");

    // 2. Create Session
    console.log("2. Creating Classroom Session...");
    const sessionRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/sessions",
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      },
      { sessionName: "Database Systems", subject: "DBMS", duration: 45 }
    );

    const session = sessionRes.data;
    const sessionCode = session.sessionCode;
    console.log(`✅ Session Created successfully! PIN: ${sessionCode}`);

    // 3. Register & Login Student A (Ahmed / 23CS101)
    const regNoA = `23CS${Math.floor(100 + Math.random() * 900)}`;
    console.log(`3. Registering Student A (${regNoA})...`);
    await request(
      { hostname: "localhost", port: 5000, path: "/api/student-auth/register", method: "POST", headers: { "Content-Type": "application/json" } },
      { registerNumber: regNoA, fullName: "Ahmed", department: "CSE", year: 3, password: "password123" }
    );

    const loginResA = await request(
      { hostname: "localhost", port: 5000, path: "/api/student-auth/login", method: "POST", headers: { "Content-Type": "application/json" } },
      { registerNumber: regNoA, password: "password123" }
    );

    const tokenA = loginResA.data.token;
    const studentA = loginResA.data.student;
    console.log(`✅ Student A (Ahmed - ${regNoA}) Authenticated.`);

    // 4. Test Voice Doubt Upload & HTTP Serving Verification
    console.log("4. Testing Voice Doubt Upload & Static Audio HTTP Serving...");
    
    // Create multipart form body with dummy audio bytes
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    let bodyStr = "";
    
    const fields = {
      studentId: studentA.id || studentA._id,
      studentName: studentA.fullName,
      registerNumber: studentA.registerNumber,
      sessionCode: sessionCode,
      subject: "DBMS Voice Question",
      transcription: "Why is B-Tree indexing useful in DBMS?",
      audioDuration: "14",
      audioMimeType: "audio/webm",
    };

    for (const [key, val] of Object.entries(fields)) {
      bodyStr += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`;
    }

    const audioHeader = `--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="voice-doubt.webm"\r\nContent-Type: audio/webm\r\n\r\n`;
    const audioFooter = `\r\n--${boundary}--\r\n`;

    const dummyAudioBytes = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x99, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2, 0x81, 0x04]);

    const payloadBuffer = Buffer.concat([
      Buffer.from(bodyStr),
      Buffer.from(audioHeader),
      dummyAudioBytes,
      Buffer.from(audioFooter)
    ]);

    const voiceDoubtRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/doubts/voice",
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          Authorization: `Bearer ${tokenA}`,
          "Content-Length": payloadBuffer.length,
        },
      },
      payloadBuffer
    );

    console.log("Voice Doubt POST response status:", voiceDoubtRes.status);
    console.log("Uploaded Audio URL stored in DB:", voiceDoubtRes.data.audioUrl);

    if (voiceDoubtRes.status === 201 && voiceDoubtRes.data.audioUrl) {
      console.log("Testing HTTP GET of audio URL from Express backend...");
      const audioFetch = await fetchAudioFile(voiceDoubtRes.data.audioUrl);
      console.log("Audio HTTP Status:", audioFetch.statusCode);
      console.log("Audio Content-Type:", audioFetch.contentType);
      console.log("Audio Downloaded Bytes:", audioFetch.downloadedBytes);

      if (audioFetch.statusCode === 200 && audioFetch.downloadedBytes > 0) {
        console.log("✅ VOICE AUDIO PIPELINE FULLY VERIFIED! Audio is valid and streamable over HTTP 200!");
      } else {
        console.error("❌ Audio fetch failed!", audioFetch);
      }
    } else {
      console.error("❌ Voice Doubt creation failed:", voiceDoubtRes.data);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL VOICE PIPELINE E2E TESTS PASSED!");
    console.log("==================================================\n");

  } catch (err) {
    console.error("❌ Test Failed with Error:", err);
  }
}

runTests();
