GRANT EXECUTE ON FUNCTION public.is_teacher_or_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) TO authenticated;