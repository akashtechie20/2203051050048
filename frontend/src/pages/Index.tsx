
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Copy, ExternalLink, BarChart3, Link2, Clock, Users, MapPin, Mouse, Calendar, Trash2 } from 'lucide-react';

interface ClickData {
  id: string;
  timestamp: Date;
  source: string;
  location: string;
}

interface ShortenedUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  customShortcode?: string;
  createdAt: Date;
  expiresAt: Date;
  validityPeriod: number; // in minutes
  clicks: number;
  isActive: boolean;
  clickData: ClickData[];
}

const Index = () => {
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [originalUrl, setOriginalUrl] = useState("");
  const [customShortcode, setCustomShortcode] = useState("");
  const [validityPeriod, setValidityPeriod] = useState("30");
  const [isLoading, setIsLoading] = useState(false);

  const generateShortCode = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const isValidInteger = (value: string): boolean => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0 && num.toString() === value;
  };

  const generateClickData = (): ClickData => {
    const sources = ['Direct', 'Google', 'Facebook', 'Twitter', 'LinkedIn', 'Reddit'];
    const locations = ['New York, US', 'London, UK', 'Tokyo, JP', 'Sydney, AU', 'Toronto, CA', 'Berlin, DE'];
    
    return {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      source: sources[Math.floor(Math.random() * sources.length)],
      location: locations[Math.floor(Math.random() * locations.length)]
    };
  };

  const shortenUrl = async () => {
    if (!originalUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL to shorten",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(originalUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (including http:// or https://)",
        variant: "destructive",
      });
      return;
    }

    if (!isValidInteger(validityPeriod)) {
      toast({
        title: "Invalid Validity Period",
        description: "Validity period must be a positive integer (minutes)",
        variant: "destructive",
      });
      return;
    }

    // Check if we already have 5 active URLs
    const activeUrls = urls.filter(url => url.isActive && new Date() < url.expiresAt);
    if (activeUrls.length >= 5) {
      toast({
        title: "Maximum URLs Reached",
        description: "You can have maximum 5 active shortened URLs at a time",
        variant: "destructive",
      });
      return;
    }

    // Check if custom shortcode is unique
    if (customShortcode && urls.some(url => url.customShortcode === customShortcode || url.shortCode === customShortcode)) {
      toast({
        title: "Shortcode already exists",
        description: "Please choose a different custom shortcode",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const shortCode = customShortcode || generateShortCode();
    const validityMinutes = parseInt(validityPeriod, 10);
    const expiryDate = new Date(Date.now() + validityMinutes * 60 * 1000);
    
    const newUrl: ShortenedUrl = {
      id: Date.now().toString(),
      originalUrl,
      shortCode,
      customShortcode: customShortcode || undefined,
      createdAt: new Date(),
      expiresAt: expiryDate,
      validityPeriod: validityMinutes,
      clicks: 0,
      isActive: true,
      clickData: []
    };

    setUrls(prev => [newUrl, ...prev]);
    setOriginalUrl("");
    setCustomShortcode("");
    setValidityPeriod("30");
    setIsLoading(false);

    console.log("URL shortened successfully:", newUrl);
    
    toast({
      title: "URL Shortened Successfully!",
      description: `Your short URL is ready and expires in ${validityMinutes} minutes`,
    });
  };

  const copyToClipboard = (shortCode: string) => {
    const shortUrl = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    toast({
      title: "Copied!",
      description: "Short URL copied to clipboard",
    });
  };

  const handleRedirect = (shortCode: string) => {
    const url = urls.find(u => u.shortCode === shortCode || u.customShortcode === shortCode);
    if (url && url.isActive && new Date() < url.expiresAt) {
      // Generate click data
      const clickData = generateClickData();
      
      // Update click count and add click data
      setUrls(prev => prev.map(u => 
        u.id === url.id ? { 
          ...u, 
          clicks: u.clicks + 1,
          clickData: [...u.clickData, clickData]
        } : u
      ));
      
      console.log(`Redirecting to: ${url.originalUrl}`, clickData);
      window.open(url.originalUrl, '_blank');
      
      toast({
        title: "Redirecting...",
        description: `Opening ${url.originalUrl}`,
      });
    } else {
      toast({
        title: "Link not found or expired",
        description: "This short URL is no longer valid",
        variant: "destructive",
      });
    }
  };

  const deleteUrl = (id: string) => {
    setUrls(prev => prev.filter(url => url.id !== id));
    toast({
      title: "URL Deleted",
      description: "Shortened URL has been removed",
    });
  };

  const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
  const activeUrls = urls.filter(url => url.isActive && new Date() < url.expiresAt).length;

  const analyticsData = urls.slice(0, 5).map(url => ({
    name: url.shortCode,
    clicks: url.clicks,
  }));

  // Statistics for detailed view
  const allClickData = urls.flatMap(url => url.clickData);
  const sourceStats = allClickData.reduce((acc, click) => {
    acc[click.source] = (acc[click.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationStats = allClickData.reduce((acc, click) => {
    acc[click.location] = (acc[click.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceChartData = Object.entries(sourceStats).map(([name, value]) => ({ name, value }));
  const locationChartData = Object.entries(locationStats).map(([name, value]) => ({ name, value }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center mr-4">
              <Link2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              URL Shortener
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform long URLs into short, manageable links with detailed analytics and custom validity periods
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="shorten" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="shorten">Shorten URL</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="shorten" className="space-y-6">
              {/* URL Shortening Form */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Create Short URL ({activeUrls}/5 Active)
                  </CardTitle>
                  <CardDescription>
                    Enter your long URL and customize your short code and validity period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Original URL *</label>
                    <Input
                      placeholder="https://example.com/very-long-url"
                      value={originalUrl}
                      onChange={(e) => setOriginalUrl(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Custom Shortcode (Optional)</label>
                    <Input
                      placeholder="my-custom-link"
                      value={customShortcode}
                      onChange={(e) => setCustomShortcode(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                      className="h-12"
                    />
                    <p className="text-xs text-gray-500">
                      Leave empty for auto-generated shortcode. Only letters, numbers, hyphens, and underscores allowed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Validity Period (Minutes) *</label>
                    <Select value={validityPeriod} onValueChange={setValidityPeriod}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select validity period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                        <SelectItem value="360">6 hours</SelectItem>
                        <SelectItem value="720">12 hours</SelectItem>
                        <SelectItem value="1440">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Or enter custom minutes"
                      value={validityPeriod}
                      onChange={(e) => setValidityPeriod(e.target.value.replace(/[^0-9]/g, ''))}
                      className="h-12 mt-2"
                    />
                  </div>

                  <Button 
                    onClick={shortenUrl}
                    disabled={isLoading || activeUrls >= 5}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold"
                  >
                    {isLoading ? "Shortening..." : activeUrls >= 5 ? "Maximum URLs Reached" : "Shorten URL"}
                  </Button>
                </CardContent>
              </Card>

              {/* Recent URLs */}
              {urls.length > 0 && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Your Shortened URLs</CardTitle>
                    <CardDescription>
                      Manage and track your shortened links
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {urls.map((url) => {
                        const isExpired = new Date() > url.expiresAt;
                        return (
                          <div key={url.id} className="p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                                    {window.location.origin}/{url.shortCode}
                                  </code>
                                  {url.customShortcode && (
                                    <Badge variant="secondary">Custom</Badge>
                                  )}
                                  {isExpired && (
                                    <Badge variant="destructive">Expired</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 truncate">{url.originalUrl}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {url.clicks} clicks
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Valid for: {url.validityPeriod} min
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Expires: {url.expiresAt.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(url.shortCode)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRedirect(url.shortCode)}
                                  disabled={isExpired}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteUrl(url.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Analytics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Total Links</p>
                        <p className="text-3xl font-bold">{urls.length}</p>
                      </div>
                      <Link2 className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Total Clicks</p>
                        <p className="text-3xl font-bold">{totalClicks}</p>
                      </div>
                      <Users className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Active Links</p>
                        <p className="text-3xl font-bold">{activeUrls}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {urls.length > 0 && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Click Analytics
                    </CardTitle>
                    <CardDescription>
                      Click performance for your top 5 shortened URLs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="clicks" fill="url(#gradient)" radius={[4, 4, 0, 0]} />
                          <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3B82F6" />
                              <stop offset="100%" stopColor="#10B981" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {urls.length === 0 && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardContent className="p-12 text-center">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Analytics Yet</h3>
                    <p className="text-gray-500">
                      Start shortening URLs to see your analytics data here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="statistics" className="space-y-6">
              {allClickData.length > 0 ? (
                <>
                  {/* Detailed URL Statistics */}
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Detailed URL Statistics
                      </CardTitle>
                      <CardDescription>
                        Comprehensive statistics for all shortened URLs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {urls.map((url) => (
                          <div key={url.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                                  {window.location.origin}/{url.shortCode}
                                </code>
                                <p className="text-sm text-gray-600 mt-1">{url.originalUrl}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-blue-600">{url.clicks}</p>
                                <p className="text-sm text-gray-500">Total Clicks</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Created</p>
                                <p className="font-medium">{url.createdAt.toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Expires</p>
                                <p className="font-medium">{url.expiresAt.toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Validity Period</p>
                                <p className="font-medium">{url.validityPeriod} minutes</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Status</p>
                                <Badge variant={new Date() > url.expiresAt ? "destructive" : "secondary"}>
                                  {new Date() > url.expiresAt ? "Expired" : "Active"}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Click Details */}
                            {url.clickData.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <h4 className="font-medium mb-2">Recent Clicks</h4>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {url.clickData.slice(-5).reverse().map((click) => (
                                    <div key={click.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                      <div className="flex items-center gap-2">
                                        <Mouse className="h-3 w-3" />
                                        <span>{click.timestamp.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-600">{click.source}</span>
                                        <MapPin className="h-3 w-3" />
                                        <span>{click.location}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Traffic Sources Chart */}
                  {sourceChartData.length > 0 && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Traffic Sources
                        </CardTitle>
                        <CardDescription>
                          Distribution of clicks by traffic source
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={sourceChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {sourceChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Geographic Distribution Chart */}
                  {locationChartData.length > 0 && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Geographic Distribution
                        </CardTitle>
                        <CardDescription>
                          Clicks by geographic location
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={locationChartData}>
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardContent className="p-12 text-center">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Statistics Available</h3>
                    <p className="text-gray-500">
                      Create shortened URLs and generate some clicks to see detailed statistics
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
