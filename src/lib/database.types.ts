export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string | null
                    display_name: string | null
                    avatar_url: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    display_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    display_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                }
            }
            boards: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    owner_id: string
                    is_public: boolean
                    password_hash: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    owner_id: string
                    is_public?: boolean
                    password_hash?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    owner_id?: string
                    is_public?: boolean
                    password_hash?: string | null
                    created_at?: string
                }
            }
            notes: {
                Row: {
                    id: string
                    board_id: string
                    author_id: string | null
                    content: Json
                    color: string
                    x: number
                    y: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    board_id: string
                    author_id?: string | null
                    content?: Json
                    color?: string
                    x?: number
                    y?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    board_id?: string
                    author_id?: string | null
                    content?: Json
                    color?: string
                    x?: number
                    y?: number
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
