import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type AuthUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
};

