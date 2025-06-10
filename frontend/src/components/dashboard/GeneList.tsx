import { useState, useEffect } from 'react';
import { useGene, IGene } from '@/lib/hooks/useGene';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ChevronDown, Star, StarOff, Dna, BarChart3, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

const GeneList = () => {
  const { 
    isLoading, 
    error, 
    userGenes, 
    pagination, 
    getUserGenes, 
    updateGene 
  } = useGene();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterFavorite, setFilterFavorite] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch genes on component mount and when filters change
  useEffect(() => {
    const fetchGenes = async () => {
      await getUserGenes({
        page: currentPage,
        limit: 8,
        sort: sortBy,
        order: sortOrder,
        geneType: filterType || undefined,
        favorite: filterFavorite ?? undefined,
        query: searchTerm || undefined
      });
    };
    
    fetchGenes();
  }, [currentPage, sortBy, sortOrder, filterType, filterFavorite, searchTerm]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };
  
  // Handle favorite toggle
  const toggleFavorite = async (gene: IGene) => {
    await updateGene(gene._id, { isFavorite: !gene.isFavorite });
  };
  
  // Render gene type badge
  const renderGeneTypeBadge = (type: string) => {
    const colors = {
      dna: 'bg-green-900/30 text-green-300 border border-green-500/30',
      crispr: 'bg-blue-900/30 text-blue-300 border border-blue-500/30',
      rna: 'bg-purple-900/30 text-purple-300 border border-purple-500/30',
      protein: 'bg-orange-900/30 text-orange-300 border border-orange-500/30',
      other: 'bg-gray-800/50 text-gray-300 border border-gray-600/30'
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors] || colors.other}>
        {type}
      </Badge>
    );
  };
  
  return (
    <Card className="backdrop-blur-sm bg-gray-900/30 border-indigo-500/20 shadow-lg w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10 rounded-lg"></div>
      
      <CardHeader className="relative border-b border-indigo-500/10 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-indigo-100">Gene Predictions</CardTitle>
            <CardDescription className="text-indigo-300/70">
              Browse and Manage your Gene sequence Analysis
            </CardDescription>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-indigo-300/50" />
              <Input
                placeholder="Search predictions..."
                className="pl-8 w-full sm:w-[180px] lg:w-[240px] bg-gray-800/50 border-indigo-500/30 focus:border-indigo-400 text-white"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="flex gap-2">
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-indigo-500/30 bg-indigo-900/20 hover:bg-indigo-600/30 text-indigo-100">
                    <BarChart3 className="mr-2 h-4 w-4 text-indigo-300" />
                    Sort
                    <ChevronDown className="ml-2 h-4 w-4 text-indigo-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border border-indigo-800/50 text-indigo-100">
                  <DropdownMenuItem 
                    onClick={() => { setSortBy('createdAt'); setSortOrder('desc'); }}
                    className={`hover:bg-indigo-900/50 hover:text-indigo-300 ${sortBy === 'createdAt' && sortOrder === 'desc' ? 'bg-indigo-900/70' : ''}`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => { setSortBy('createdAt'); setSortOrder('asc'); }}
                    className={`hover:bg-indigo-900/50 hover:text-indigo-300 ${sortBy === 'createdAt' && sortOrder === 'asc' ? 'bg-indigo-900/70' : ''}`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => { setSortBy('efficiency'); setSortOrder('desc'); }}
                    className={`hover:bg-indigo-900/50 hover:text-indigo-300 ${sortBy === 'efficiency' && sortOrder === 'desc' ? 'bg-indigo-900/70' : ''}`}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Highest Efficiency
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => { setSortBy('efficiency'); setSortOrder('asc'); }}
                    className={`hover:bg-indigo-900/50 hover:text-indigo-300 ${sortBy === 'efficiency' && sortOrder === 'asc' ? 'bg-indigo-900/70' : ''}`}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Lowest Efficiency
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-indigo-500/30 bg-indigo-900/20 hover:bg-indigo-600/30 text-indigo-100">
                    <Filter className="mr-2 h-4 w-4 text-indigo-300" />
                    Filter
                    <ChevronDown className="ml-2 h-4 w-4 text-indigo-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border border-indigo-800/50 text-indigo-100">
                  <DropdownMenuItem 
                    onClick={() => { setFilterType(null); setFilterFavorite(null); }}
                    className={`hover:bg-indigo-900/50 hover:text-indigo-300 ${filterType === null && filterFavorite === null ? 'bg-indigo-900/70' : ''}`}
                  >
                    All Types
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setFilterType('dna')}
                    className={`hover:bg-indigo-900/50 hover:text-indigo-300 ${filterType === 'dna' ? 'bg-indigo-900/70' : ''}`}
                  >
                    <Dna className="mr-2 h-4 w-4 text-green-300" />
                    DNA Only
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setFilterType('crispr')}
                    className={`hover:bg-indigo-900/50 hover:text-indigo-300 ${filterType === 'crispr' ? 'bg-indigo-900/70' : ''}`}
                  >
                    <Dna className="mr-2 h-4 w-4 text-blue-300" />
                    CRISPR Only
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setFilterFavorite(true)}
                    className={`hover:bg-indigo-900/50 hover:text-indigo-300 ${filterFavorite === true ? 'bg-indigo-900/70' : ''}`}
                  >
                    <Star className="mr-2 h-4 w-4 text-yellow-300" />
                    Favorites Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative py-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
              <div className="absolute inset-3 rounded-full border-t-2 border-l-2 border-cyan-400 animate-spin-slow"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-900/10 rounded-lg border border-red-500/10">
            <p className="text-lg text-red-300">Error loading predictions</p>
            <p className="text-sm text-red-300/70 mt-1">{error}</p>
          </div>
        ) : userGenes.length === 0 ? (
          <div className="text-center py-12 bg-indigo-900/10 rounded-lg border border-indigo-500/10">
            <Dna className="h-12 w-12 mx-auto mb-4 text-indigo-400/50" />
            <p className="text-lg text-indigo-300">No gene predictions found</p>
            <p className="text-sm text-indigo-300/70 mt-1">
              {searchTerm || filterType || filterFavorite !== null 
                ? 'Try adjusting your search or filters'
                : 'Create your first gene prediction to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {userGenes.map((gene, index) => (
                <motion.div
                  key={gene._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden bg-gray-800/30 border-indigo-500/20 hover:border-indigo-500/40 hover:bg-gray-800/40 transition-all duration-300 h-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 mr-2">
                          <CardTitle className="text-lg text-indigo-100 truncate">{gene.name}</CardTitle>
                          <CardDescription className="text-indigo-300/70">
                            {format(new Date(gene.createdAt), 'PPP')}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-yellow-300 hover:text-yellow-400 hover:bg-yellow-900/20"
                          onClick={() => toggleFavorite(gene)}
                        >
                          {gene.isFavorite ? (
                            <Star className="h-5 w-5 fill-yellow-300" />
                          ) : (
                            <StarOff className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {renderGeneTypeBadge(gene.geneType)}
                        <Badge className="bg-indigo-900/30 text-indigo-300 border border-indigo-500/30">
                          {gene.editCount} edit{gene.editCount !== 1 ? 's' : ''}
                        </Badge>
                        <Badge className="bg-cyan-900/30 text-cyan-300 border border-cyan-500/30">
                          {gene.efficiency.toFixed(1)}% efficiency
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="font-mono text-xs bg-gray-900/50 p-2 rounded border border-gray-700/50 overflow-x-auto">
                        <div className="text-gray-400">Original: <span className="text-green-300">{gene.originalSequence}</span></div>
                        <div className="text-gray-400">Predicted: <span className="text-cyan-300">{gene.predictedSequence}</span></div>
                      </div>
                      {gene.description && (
                        <p className="mt-2 text-sm text-indigo-300/80 line-clamp-2">{gene.description}</p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        variant="link" 
                        className="text-indigo-300 hover:text-indigo-100 p-0"
                        onClick={() => window.location.href = `/dashboard/gene/${gene._id}`}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* Pagination Controls */}
        {!isLoading && !error && userGenes.length > 0 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-indigo-300/70">
              Showing {userGenes.length} of {pagination.total} predictions
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-indigo-500/30 bg-indigo-900/20 hover:bg-indigo-600/30 text-indigo-100"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-indigo-500/30 bg-indigo-900/20 hover:bg-indigo-600/30 text-indigo-100"
                disabled={currentPage >= pagination.pages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneList; 