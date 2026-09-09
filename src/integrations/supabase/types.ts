export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admissions: {
        Row: {
          address: string | null
          applicant_name: string
          created_at: string
          date_of_birth: string | null
          grade: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          notes: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          applicant_name: string
          created_at?: string
          date_of_birth?: string | null
          grade?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          applicant_name?: string
          created_at?: string
          date_of_birth?: string | null
          grade?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      alumni_directory: {
        Row: {
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          employer: string | null
          graduation_year: number | null
          id: string
          linkedin: string | null
          name: string
          profile_id: string | null
          role: string | null
          updated_at: string
          visible: boolean | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          employer?: string | null
          graduation_year?: number | null
          id?: string
          linkedin?: string | null
          name: string
          profile_id?: string | null
          role?: string | null
          updated_at?: string
          visible?: boolean | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          employer?: string | null
          graduation_year?: number | null
          id?: string
          linkedin?: string | null
          name?: string
          profile_id?: string | null
          role?: string | null
          updated_at?: string
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "alumni_directory_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: string | null
          author: string | null
          body: string | null
          created_at: string
          id: string
          publish_date: string | null
          published: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string | null
          author?: string | null
          body?: string | null
          created_at?: string
          id?: string
          publish_date?: string | null
          published?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string | null
          author?: string | null
          body?: string | null
          created_at?: string
          id?: string
          publish_date?: string | null
          published?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          class_id: string | null
          class_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string | null
          subject: string | null
          submissions: number | null
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          subject?: string | null
          submissions?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          subject?: string | null
          submissions?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          absent: number | null
          attendance_date: string
          class_id: string | null
          class_name: string | null
          created_at: string
          id: string
          late: number | null
          present: number | null
          recorded_by: string | null
          status: string | null
          student_id: string | null
          student_name: string | null
          updated_at: string
        }
        Insert: {
          absent?: number | null
          attendance_date: string
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          id?: string
          late?: number | null
          present?: number | null
          recorded_by?: string | null
          status?: string | null
          student_id?: string | null
          student_name?: string | null
          updated_at?: string
        }
        Update: {
          absent?: number | null
          attendance_date?: string
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          id?: string
          late?: number | null
          present?: number | null
          recorded_by?: string | null
          status?: string | null
          student_id?: string | null
          student_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      behavior_records: {
        Row: {
          class_name: string | null
          created_at: string
          description: string | null
          id: string
          incident_date: string | null
          record_type: string | null
          reporter: string | null
          student_id: string | null
          student_name: string
          updated_at: string
        }
        Insert: {
          class_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string | null
          record_type?: string | null
          reporter?: string | null
          student_id?: string | null
          student_name: string
          updated_at?: string
        }
        Update: {
          class_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string | null
          record_type?: string | null
          reporter?: string | null
          student_id?: string | null
          student_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavior_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          audience: string | null
          created_at: string
          description: string | null
          end_date: string | null
          event_type: string | null
          id: string
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          capacity: number | null
          created_at: string
          id: string
          level: string | null
          name: string
          room: string | null
          schedule: string | null
          student_count: number | null
          teacher_id: string | null
          teacher_name: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          id?: string
          level?: string | null
          name: string
          room?: string | null
          schedule?: string | null
          student_count?: number | null
          teacher_id?: string | null
          teacher_name?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          id?: string
          level?: string | null
          name?: string
          room?: string | null
          schedule?: string | null
          student_count?: number | null
          teacher_id?: string | null
          teacher_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_visits: {
        Row: {
          action_taken: string | null
          created_at: string
          id: string
          nurse: string | null
          reason: string | null
          status: string | null
          student_id: string | null
          student_name: string
          updated_at: string
          visit_date: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          id?: string
          nurse?: string | null
          reason?: string | null
          status?: string | null
          student_id?: string | null
          student_name: string
          updated_at?: string
          visit_date?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          id?: string
          nurse?: string | null
          reason?: string | null
          status?: string | null
          student_id?: string | null
          student_name?: string
          updated_at?: string
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_visits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_media: {
        Row: {
          created_at: string
          file_url: string | null
          folder: string | null
          id: string
          mime_type: string | null
          name: string
          size: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          folder?: string | null
          id?: string
          mime_type?: string | null
          name: string
          size?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_url?: string | null
          folder?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          size?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          content: Json
          created_at: string
          id: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      cms_posts: {
        Row: {
          author: string | null
          content: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          publish_date: string | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          publish_date?: string | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          publish_date?: string | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          lead: string | null
          name: string
          staff_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          lead?: string | null
          name: string
          staff_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          lead?: string | null
          name?: string
          staff_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount_lrd: number
          amount_usd: number
          anonymous: boolean | null
          created_at: string
          donation_date: string | null
          donor_email: string | null
          donor_name: string
          fund: string | null
          id: string
          message: string | null
          method: string | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount_lrd?: number
          amount_usd?: number
          anonymous?: boolean | null
          created_at?: string
          donation_date?: string | null
          donor_email?: string | null
          donor_name: string
          fund?: string | null
          id?: string
          message?: string | null
          method?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount_lrd?: number
          amount_usd?: number
          anonymous?: boolean | null
          created_at?: string
          donation_date?: string | null
          donor_email?: string | null
          donor_name?: string
          fund?: string | null
          id?: string
          message?: string | null
          method?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          image_url: string | null
          location: string | null
          public_event: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          public_event?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          public_event?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          class_name: string | null
          created_at: string
          exam_date: string | null
          id: string
          room: string | null
          status: string | null
          subject: string
          term: string | null
          updated_at: string
        }
        Insert: {
          class_name?: string | null
          created_at?: string
          exam_date?: string | null
          id?: string
          room?: string | null
          status?: string | null
          subject: string
          term?: string | null
          updated_at?: string
        }
        Update: {
          class_name?: string | null
          created_at?: string
          exam_date?: string | null
          id?: string
          room?: string | null
          status?: string | null
          subject?: string
          term?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fees: {
        Row: {
          amount_lrd: number
          amount_usd: number
          created_at: string
          due_date: string | null
          id: string
          item: string
          method: string | null
          paid_date: string | null
          reference: string | null
          status: string | null
          student_id: string | null
          student_name: string
          updated_at: string
        }
        Insert: {
          amount_lrd?: number
          amount_usd?: number
          created_at?: string
          due_date?: string | null
          id?: string
          item: string
          method?: string | null
          paid_date?: string | null
          reference?: string | null
          status?: string | null
          student_id?: string | null
          student_name: string
          updated_at?: string
        }
        Update: {
          amount_lrd?: number
          amount_usd?: number
          created_at?: string
          due_date?: string | null
          id?: string
          item?: string
          method?: string | null
          paid_date?: string | null
          reference?: string | null
          status?: string | null
          student_id?: string | null
          student_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          class_name: string | null
          created_at: string
          id: string
          letter_grade: string | null
          recorded_by: string | null
          score: number | null
          student_id: string | null
          student_name: string
          subject: string
          term: string | null
          updated_at: string
        }
        Insert: {
          class_name?: string | null
          created_at?: string
          id?: string
          letter_grade?: string | null
          recorded_by?: string | null
          score?: number | null
          student_id?: string | null
          student_name: string
          subject: string
          term?: string | null
          updated_at?: string
        }
        Update: {
          class_name?: string | null
          created_at?: string
          id?: string
          letter_grade?: string | null
          recorded_by?: string | null
          score?: number | null
          student_id?: string | null
          student_name?: string
          subject?: string
          term?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          caption: string | null
          created_at: string
          cta_link: string | null
          cta_text: string | null
          enabled: boolean | null
          heading: string | null
          id: string
          image_url: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          enabled?: boolean | null
          heading?: string | null
          id?: string
          image_url: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          enabled?: boolean | null
          heading?: string | null
          id?: string
          image_url?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string | null
          condition: string | null
          created_at: string
          id: string
          item: string
          location: string | null
          quantity: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          item: string
          location?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          item?: string
          location?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          apply_url: string | null
          company: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          posted_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          apply_url?: string | null
          company?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          posted_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          apply_url?: string | null
          company?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          posted_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_plans: {
        Row: {
          class_name: string | null
          created_at: string
          id: string
          objectives: string | null
          status: string | null
          subject: string | null
          teacher_id: string | null
          title: string
          updated_at: string
          week: string | null
        }
        Insert: {
          class_name?: string | null
          created_at?: string
          id?: string
          objectives?: string | null
          status?: string | null
          subject?: string | null
          teacher_id?: string | null
          title: string
          updated_at?: string
          week?: string | null
        }
        Update: {
          class_name?: string | null
          created_at?: string
          id?: string
          objectives?: string | null
          status?: string | null
          subject?: string | null
          teacher_id?: string | null
          title?: string
          updated_at?: string
          week?: string | null
        }
        Relationships: []
      }
      library_books: {
        Row: {
          author: string | null
          category: string | null
          copies_available: number | null
          copies_total: number | null
          created_at: string
          id: string
          isbn: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          copies_available?: number | null
          copies_total?: number | null
          created_at?: string
          id?: string
          isbn?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          copies_available?: number | null
          copies_total?: number | null
          created_at?: string
          id?: string
          isbn?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          recipient_id: string | null
          recipient_name: string | null
          sender_id: string | null
          sender_name: string | null
          sent_at: string
          subject: string | null
          unread: boolean | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          recipient_id?: string | null
          recipient_name?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sent_at?: string
          subject?: string | null
          unread?: boolean | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          recipient_id?: string | null
          recipient_name?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sent_at?: string
          subject?: string | null
          unread?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          class_name: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          email: string | null
          emergency_contact: string | null
          full_name: string | null
          grade: string | null
          graduation_year: number | null
          id: string
          linked_children: string[] | null
          phone: string | null
          subjects: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          class_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name?: string | null
          grade?: string | null
          graduation_year?: number | null
          id: string
          linked_children?: string[] | null
          phone?: string | null
          subjects?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          class_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name?: string | null
          grade?: string | null
          graduation_year?: number | null
          id?: string
          linked_children?: string[] | null
          phone?: string | null
          subjects?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          size: string | null
          title: string
          type: string | null
          updated_at: string
          visibility: string | null
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          size?: string | null
          title: string
          type?: string | null
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          size?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          visibility?: string | null
        }
        Relationships: []
      }
      scholarships: {
        Row: {
          amount_lrd: number | null
          amount_usd: number | null
          created_at: string
          id: string
          sponsor: string | null
          status: string | null
          student_id: string | null
          student_name: string
          term: string | null
          updated_at: string
        }
        Insert: {
          amount_lrd?: number | null
          amount_usd?: number | null
          created_at?: string
          id?: string
          sponsor?: string | null
          status?: string | null
          student_id?: string | null
          student_name: string
          term?: string | null
          updated_at?: string
        }
        Update: {
          amount_lrd?: number | null
          amount_usd?: number | null
          created_at?: string
          id?: string
          sponsor?: string | null
          status?: string | null
          student_id?: string | null
          student_name?: string
          term?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          hire_date: string | null
          id: string
          name: string
          phone: string | null
          profile_id: string | null
          role: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          name: string
          phone?: string | null
          profile_id?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          name?: string
          phone?: string | null
          profile_id?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_salaries: {
        Row: {
          created_at: string
          id: string
          salary_lrd: number | null
          salary_usd: number | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          salary_lrd?: number | null
          salary_usd?: number | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          salary_lrd?: number | null
          salary_usd?: number | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_salaries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          enabled: boolean | null
          id: string
          linkedin: string | null
          name: string
          photo_url: string | null
          role: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          enabled?: boolean | null
          id?: string
          linkedin?: string | null
          name: string
          photo_url?: string | null
          role?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          enabled?: boolean | null
          id?: string
          linkedin?: string | null
          name?: string
          photo_url?: string | null
          role?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      timetable: {
        Row: {
          class_id: string | null
          class_name: string | null
          created_at: string
          day: string
          end_time: string | null
          id: string
          room: string | null
          start_time: string
          subject: string | null
          teacher_name: string | null
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          day: string
          end_time?: string | null
          id?: string
          room?: string | null
          start_time: string
          subject?: string | null
          teacher_name?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          day?: string
          end_time?: string | null
          id?: string
          room?: string | null
          start_time?: string
          subject?: string | null
          teacher_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_routes: {
        Row: {
          created_at: string
          departure: string | null
          driver: string | null
          fee_lrd: number | null
          fee_usd: number | null
          id: string
          riders: number | null
          route: string
          updated_at: string
          vehicle: string | null
        }
        Insert: {
          created_at?: string
          departure?: string | null
          driver?: string | null
          fee_lrd?: number | null
          fee_usd?: number | null
          id?: string
          riders?: number | null
          route: string
          updated_at?: string
          vehicle?: string | null
        }
        Update: {
          created_at?: string
          departure?: string | null
          driver?: string | null
          fee_lrd?: number | null
          fee_usd?: number | null
          id?: string
          riders?: number | null
          route?: string
          updated_at?: string
          vehicle?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_parent_of: {
        Args: { _child: string; _parent: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_teacher_or_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "superadmin"
        | "admin"
        | "teacher"
        | "student"
        | "parent"
        | "alumni"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "superadmin",
        "admin",
        "teacher",
        "student",
        "parent",
        "alumni",
      ],
    },
  },
} as const
