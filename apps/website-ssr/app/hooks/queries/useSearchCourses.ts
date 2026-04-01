import { searchCourses } from '@uni-feedback/api-client'
import type { SearchCoursesParams } from '@uni-feedback/api-client'
import { useQuery } from '@tanstack/react-query'

export function useSearchCourses(params: SearchCoursesParams | null) {
  return useQuery({
    queryKey: ['courses', 'search', params],
    queryFn: () => (params ? searchCourses(params) : Promise.resolve(null)),
    enabled:
      !!params && (!!params.q || !!params.faculty_id || !!params.degree_id),
    staleTime: 30000 // 30 seconds
  })
}
