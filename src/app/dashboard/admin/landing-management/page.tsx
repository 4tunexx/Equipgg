"use client";

import React, { useState } from 'react';
import Image from 'next/image';

// TypeScript interfaces for UI components
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

// Section data interfaces
interface SectionItem {
  title: string;
  description: string;
}

interface BaseSection {
  id: string;
  title: string;
}

interface HeroSection extends BaseSection {
  subtitle: string;
  description: string;
  buttonText: string;
  imagePath: string;
}

interface FeatureSection extends BaseSection {
  items: SectionItem[];
}

interface AboutSection extends BaseSection {
  description: string;
}

type Section = HeroSection | FeatureSection | AboutSection;

// Type guard functions
const isHeroSection = (section: Section): section is HeroSection => {
  return 'subtitle' in section && 'buttonText' in section && 'imagePath' in section;
};

const isFeatureSection = (section: Section): section is FeatureSection => {
  return 'items' in section;
};

const isAboutSection = (section: Section): section is AboutSection => {
  return 'description' in section && !('items' in section) && !('subtitle' in section);
};

// Inline UI components to avoid import resolution issues
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background ${
        variant === 'default' ?
          'bg-primary text-primary-foreground hover:bg-primary/90' :
        variant === 'destructive' ?
          'bg-destructive text-destructive-foreground hover:bg-destructive/90' :
        variant === 'outline' ?
          'border border-input hover:bg-accent hover:text-accent-foreground' :
        variant === 'secondary' ?
          'bg-secondary text-secondary-foreground hover:bg-secondary/80' :
        variant === 'ghost' ?
          'hover:bg-accent hover:text-accent-foreground' :
        variant === 'link' ?
          'underline-offset-4 hover:underline text-primary' :
          'bg-primary text-primary-foreground hover:bg-primary/90'
      } ${
        size === 'default' ? 'h-10 py-2 px-4' :
        size === 'sm' ? 'h-9 px-3 rounded-md' :
        size === 'lg' ? 'h-11 px-8 rounded-md' :
        size === 'icon' ? 'h-10 w-10' :
        'h-10 py-2 px-4'
      } ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-6 ${className}`}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-muted-foreground ${className}`}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center p-6 pt-0 ${className}`}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  />
));
Label.displayName = "Label";

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export default function LandingManagement() {
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'hero',
      title: 'Hero Section',
      subtitle: 'Welcome to EquipGG',
      description: 'Your ultimate CS2 betting and gaming platform',
      buttonText: 'Get Started',
      imagePath: '/public/hero.png'
    },
    {
      id: 'features',
      title: 'Features',
      items: [
        { title: 'CS2 Betting', description: 'Bet on professional CS2 matches' },
        { title: 'Case Opening', description: 'Open cases with exclusive skins' },
        { title: 'Trade Up', description: 'Trade your skins for better ones' }
      ]
    },
    {
      id: 'about',
      title: 'About Us',
      description: 'Learn more about our platform and mission'
    }
  ]);
  
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  
  const handleSectionSelect = (section: Section) => {
    setCurrentSection(section);
    setEditingSection({...section});
  };
  
  const handleSave = () => {
    if (!editingSection) return;
    
    setSections(sections.map(s => 
      s.id === editingSection.id ? editingSection : s
    ));
    
    setCurrentSection(editingSection);
  };
  
  const handleAddSection = () => {
    const newSection: AboutSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      description: 'Section description here'
    };
    
    setSections([...sections, newSection]);
    handleSectionSelect(newSection);
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Landing Page Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription>Manage landing page sections</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {sections.map(section => (
                <li key={section.id}>
                  <Button
                    variant={currentSection?.id === section.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleSectionSelect(section)}
                  >
                    {section.title}
                  </Button>
                </li>
              ))}
            </ul>
            
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={handleAddSection}
            >
              Add Section
            </Button>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>
              {currentSection ? `Edit: ${currentSection.title}` : 'Select a section'}
            </CardTitle>
            <CardDescription>
              {currentSection ? 'Modify section properties' : 'Choose a section from the list'}
            </CardDescription>
          </CardHeader>
          
          {editingSection && (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="section-title">Section Title</Label>
                  <Input
                    id="section-title"
                    value={editingSection?.title || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      editingSection && setEditingSection({...editingSection, title: e.target.value})
                    }
                  />
                </div>
                
                {editingSection && isHeroSection(editingSection) && (
                  <div>
                    <Label htmlFor="section-subtitle">Subtitle</Label>
                    <Input
                      id="section-subtitle"
                      value={editingSection.subtitle || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setEditingSection({...editingSection, subtitle: e.target.value})
                      }
                    />
                  </div>
                )}
                
                {editingSection && (isHeroSection(editingSection) || isAboutSection(editingSection)) && (
                  <div>
                    <Label htmlFor="section-description">Description</Label>
                    <Textarea
                      id="section-description"
                      value={editingSection.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                        setEditingSection({...editingSection, description: e.target.value})
                      }
                    />
                  </div>
                )}
                
                {editingSection && isHeroSection(editingSection) && (
                  <div>
                    <Label htmlFor="button-text">Button Text</Label>
                    <Input
                      id="button-text"
                      value={editingSection.buttonText || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setEditingSection({...editingSection, buttonText: e.target.value})
                      }
                    />
                  </div>
                )}
                
                {editingSection && isHeroSection(editingSection) && (
                  <div>
                    <Label htmlFor="image-path">Image Path</Label>
                    <Input
                      id="image-path"
                      value={editingSection.imagePath || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setEditingSection({...editingSection, imagePath: e.target.value})
                      }
                    />
                  </div>
                )}
                
                {editingSection && isFeatureSection(editingSection) && (
                  <div>
                    <Label className="block mb-2">Items</Label>
                    {editingSection.items.map((item: SectionItem, index: number) => (
                      <div key={index} className="grid grid-cols-2 gap-2 mb-2 p-2 border rounded">
                        <Input
                          placeholder="Title"
                          value={item.title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newItems = [...editingSection.items];
                            newItems[index] = {...newItems[index], title: e.target.value};
                            setEditingSection({...editingSection, items: newItems});
                          }}
                        />
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newItems = [...editingSection.items];
                            newItems[index] = {...newItems[index], description: e.target.value};
                            setEditingSection({...editingSection, items: newItems});
                          }}
                        />
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newItems = [...editingSection.items, { title: '', description: '' }];
                        setEditingSection({...editingSection, items: newItems});
                      }}
                    >
                      Add Item
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          )}
          
          {editingSection && (
            <CardFooter>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}