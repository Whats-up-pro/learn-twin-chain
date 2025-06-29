import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  StarIcon,
  XMarkIcon,
  BookOpenIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import InteractiveDemo from '../components/InteractiveDemo';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  institution: string;
  program: string;
  skills: Record<string, number>;
  matchScore: number;
}

const EmployerStudentSearchPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Dữ liệu mẫu từ NFT (đơn giản hóa)
  useEffect(() => {
    const mockStudents: Student[] = [
      {
        id: '1',
        name: 'Đoàn Minh Trung',
        institution: 'BKU',
        program: 'Computer Science',
        skills: {
          'Python': 0.95,
          'Data Structures': 1.0,
          'Algorithms': 0.88,
          'Machine Learning': 0.75,
          'SQL': 0.82,
          'Git': 0.90
        },
        matchScore: 95
      },
      {
        id: '2',
        name: 'Phan Thế Duy',
        institution: 'UIT',
        program: 'Information Systems',
        skills: {
          'HTML': 0.85,
          'CSS': 0.88,
          'JavaScript': 0.75,
          'React': 0.70,
          'Python': 0.60,
          'UI/UX Design': 0.80
        },
        matchScore: 87
      },
      {
        id: '3',
        name: 'Phạm Văn Hậu',
        institution: 'HCMUS',
        program: 'Cybersecurity',
        skills: {
          'Java': 0.88,
          'Spring Boot': 0.82,
          'SQL': 0.85,
          'Docker': 0.75,
          'AWS': 0.70,
          'Microservices': 0.78,
          'Git': 0.90
        },
        matchScore: 89
      },
      {
        id: '4',
        name: 'Lê Thị Mai',
        institution: 'FPT',
        program: 'Software Engineering',
        skills: {
          'UI/UX Design': 0.90,
          'Figma': 0.88,
          'Adobe XD': 0.85,
          'HTML': 0.82,
          'CSS': 0.88,
          'JavaScript': 0.75,
          'Prototyping': 0.92
        },
        matchScore: 91
      },
      {
        id: '5',
        name: 'Nguyễn Văn Nam',
        institution: 'VNU-HCM',
        program: 'Data Science',
        skills: {
          'Python': 0.95,
          'R': 0.78,
          'Machine Learning': 0.92,
          'Statistics': 0.85,
          'SQL': 0.88,
          'Data Visualization': 0.90,
          'Deep Learning': 0.82
        },
        matchScore: 94
      }
    ];

    setTimeout(() => {
      setStudents(mockStudents);
      setFilteredStudents(mockStudents);
      setLoading(false);
    }, 1000);
  }, []);

  // Get skills, programs, institutions list from data
  const availableSkills = Array.from(new Set(
    students.flatMap(student => Object.keys(student.skills))
  )).sort();

  const availablePrograms = Array.from(new Set(
    students.map(student => student.program)
  )).sort();

  const availableInstitutions = Array.from(new Set(
    students.map(student => student.institution)
  )).sort();

  // Search conditions to add to filters
  useEffect(() => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const results: string[] = [];
      
      // Search in skills
      availableSkills.forEach(skill => {
        if (skill.toLowerCase().includes(searchLower) && !selectedSkills.includes(skill)) {
          results.push(`skill:${skill}`);
        }
      });
      
      // Search in programs
      availablePrograms.forEach(program => {
        if (program.toLowerCase().includes(searchLower) && !selectedPrograms.includes(program)) {
          results.push(`program:${program}`);
        }
      });
      
      // Search in institutions
      availableInstitutions.forEach(institution => {
        if (institution.toLowerCase().includes(searchLower) && !selectedInstitutions.includes(institution)) {
          results.push(`institution:${institution}`);
        }
      });
      
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchTerm, selectedSkills, selectedPrograms, selectedInstitutions, availableSkills, availablePrograms, availableInstitutions]);

  // Filter students based on selected filters
  useEffect(() => {
    let filtered = students;

    // Filter by selected skills
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(student => {
        return selectedSkills.some(skill => 
          student.skills[skill] && student.skills[skill] >= 0.7
        );
      });
    }

    // Filter by selected programs
    if (selectedPrograms.length > 0) {
      filtered = filtered.filter(student => 
        selectedPrograms.includes(student.program)
      );
    }

    // Filter by selected institutions
    if (selectedInstitutions.length > 0) {
      filtered = filtered.filter(student => 
        selectedInstitutions.includes(student.institution)
      );
    }

    // Sort by match score
    filtered.sort((a, b) => b.matchScore - a.matchScore);
    
    setFilteredStudents(filtered);
  }, [students, selectedSkills, selectedPrograms, selectedInstitutions]);

  const handleAddFilter = (filterString: string) => {
    const [type, value] = filterString.split(':');
    
    switch (type) {
      case 'skill':
        if (!selectedSkills.includes(value)) {
          setSelectedSkills(prev => [...prev, value]);
          toast.success(`Skill added: ${value}`);
        }
        break;
      case 'program':
        if (!selectedPrograms.includes(value)) {
          setSelectedPrograms(prev => [...prev, value]);
          toast.success(`Program added: ${value}`);
        }
        break;
      case 'institution':
        if (!selectedInstitutions.includes(value)) {
          setSelectedInstitutions(prev => [...prev, value]);
          toast.success(`Institution added: ${value}`);
        }
        break;
    }
    
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleProgramToggle = (program: string) => {
    setSelectedPrograms(prev => 
      prev.includes(program) 
        ? prev.filter(p => p !== program)
        : [...prev, program]
    );
  };

  const handleInstitutionToggle = (institution: string) => {
    setSelectedInstitutions(prev => 
      prev.includes(institution) 
        ? prev.filter(i => i !== institution)
        : [...prev, institution]
    );
  };

  const clearFilters = () => {
    setSelectedSkills([]);
    setSelectedPrograms([]);
    setSelectedInstitutions([]);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const getSkillLevel = (level: number) => {
    if (level >= 0.9) return { text: 'Expert', color: 'bg-green-100 text-green-800' };
    if (level >= 0.8) return { text: 'Advanced', color: 'bg-blue-100 text-blue-800' };
    if (level >= 0.7) return { text: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Beginner', color: 'bg-gray-100 text-gray-800' };
  };

  const getTopSkills = (student: Student) => {
    return Object.entries(student.skills)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Interactive Demo Info */}
      <InteractiveDemo />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Search</h1>
          <p className="text-gray-600 mt-1">Search students by skills, programs and institutions</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{filteredStudents.length}</div>
          <div className="text-sm text-gray-600">Matching students</div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Search Bar for Filter Conditions */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills, programs or institutions to add to filters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Type skill names, programs or institutions to find and add to filters
          </p>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => {
                const [type, value] = result.split(':');
                const getIcon = () => {
                  switch (type) {
                    case 'skill': return <FunnelIcon className="w-4 h-4 text-blue-500" />;
                    case 'program': return <BookOpenIcon className="w-4 h-4 text-green-500" />;
                    case 'institution': return <BuildingOfficeIcon className="w-4 h-4 text-purple-500" />;
                    default: return <PlusIcon className="w-4 h-4 text-gray-500" />;
                  }
                };
                const getTypeText = () => {
                  switch (type) {
                    case 'skill': return 'Skill';
                    case 'program': return 'Program';
                    case 'institution': return 'Institution';
                    default: return 'Other';
                  }
                };
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAddFilter(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                  >
                    {getIcon()}
                    <div>
                      <div className="font-medium text-gray-900">{value}</div>
                      <div className="text-sm text-gray-500">{getTypeText()}</div>
                    </div>
                    <PlusIcon className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear all filters
          </button>
        </div>

        {/* Skills Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FunnelIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filter by skills:</h3>
            {selectedSkills.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {selectedSkills.length} skills selected
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedSkills.includes(skill)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Programs Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpenIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filter by programs:</h3>
            {selectedPrograms.length > 0 && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {selectedPrograms.length} programs selected
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availablePrograms.map((program) => (
              <button
                key={program}
                onClick={() => handleProgramToggle(program)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedPrograms.includes(program)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {program}
              </button>
            ))}
          </div>
        </div>

        {/* Institutions Filter */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filter by institutions:</h3>
            {selectedInstitutions.length > 0 && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {selectedInstitutions.length} institutions selected
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableInstitutions.map((institution) => (
              <button
                key={institution}
                onClick={() => handleInstitutionToggle(institution)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedInstitutions.includes(institution)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {institution}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Student list ({filteredStudents.length})
          </h2>
        </div>
        <div className="p-6">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching students found</h3>
              <p className="text-gray-600">Try changing filters to find suitable students</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {student.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{student.name}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <StarIcon className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {student.matchScore}% match
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {student.program}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {student.institution}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Top Skills */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Top skills:</h4>
                        <div className="flex flex-wrap gap-2">
                          {getTopSkills(student).map(([skill, level]) => {
                            const skillLevel = getSkillLevel(level);
                            return (
                              <span
                                key={skill}
                                className={`px-2 py-1 rounded text-xs font-medium ${skillLevel.color}`}
                              >
                                {skill} ({skillLevel.text})
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Skills Match */}
                      {selectedSkills.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Matching skills:</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedSkills.map((skill) => {
                              const level = student.skills[skill] || 0;
                              const skillLevel = getSkillLevel(level);
                              return (
                                <span
                                  key={skill}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    level >= 0.7 ? skillLevel.color : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {skill} ({Math.round(level * 100)}%)
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <button
                        onClick={() => {
                          toast.success(`Contacted ${student.name}`);
                        }}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerStudentSearchPage; 