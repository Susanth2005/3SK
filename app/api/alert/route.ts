import { NextResponse } from 'next/server';
import { ref, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lat, lng, message } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Missing lat or lng coordinates' },
        { status: 400 }
      );
    }

    // Create a new unique reference in the 'alerts' list
    const alertsRef = ref(database, 'alerts');
    const newAlertRef = push(alertsRef);

    const alertData = {
      lat: Number(lat),
      lng: Number(lng),
      message: message || "Fire detected by hardware sensor",
      timestamp: Date.now(),
      status: 'pending'
    };

    // Push the event to Firebase Realtime Database
    await set(newAlertRef, alertData);

    return NextResponse.json(
      { success: true, id: newAlertRef.key, data: alertData },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API /alert error:", error);
    return NextResponse.json(
      { error: 'Failed to process alert', details: error.message },
      { status: 500 }
    );
  }
}
