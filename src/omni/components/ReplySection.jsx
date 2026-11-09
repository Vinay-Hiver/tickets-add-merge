import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Undo, Redo, ChevronDown, Check
} from 'lucide-react';
import { Extension } from '@tiptap/core';

import { Icon } from '../../icons/Icon';
import './ReplySection.css';

// Icons from assets/icons
import replyIcon from '../assets/icons/reply.svg';
import chevronDownIcon from '../assets/icons/s-chevron-down.svg';
import closeChipIcon from '../assets/icons/tabs-close.svg';
import kebabIcon from '../assets/icons/kebab-menu.svg';
import aiIcon from '../assets/icons/title-ai.svg';
import sDateIcon from '../assets/icons/s-date.svg';

// Icons from assets/icons/Read
import attachIcon from '../assets/icons/Read/attach.svg';
import discardIcon from '../assets/icons/Read/discard.svg';
import emojiIcon from '../assets/icons/Read/emoji.svg';
import saveIcon from '../assets/icons/Read/save.svg';
import shareIcon from '../assets/icons/Read/share.svg';
import signatureIcon from '../assets/icons/Read/signature.svg';
import templatesIcon from '../assets/icons/Read/templates.svg';
import textIcon from '../assets/icons/Read/text.svg';
import addIcon from '../assets/icons/add-icon.svg';

// Custom Extension for Font Size (same as built earlier)
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

const ReplySection = ({ 
  recipientEmail, 
  onDiscard, 
  onSend,
  quotedEmail,
  recipientName,
  currentInbox 
}) => {
  // "..." under the editor shows the email being replied to (the same button and quote as on an email card).
  const [showQuoted, setShowQuoted] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const [showFormatting, setShowFormatting] = useState(true);
  // Send turns blue once something is typed.
  const [isEmpty, setIsEmpty] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: 'Start with \'/\' to select a email template',
      }),
      FontSize,
    ],
    content: '',
    autofocus: 'end',
    onUpdate: ({ editor: e }) => setIsEmpty(!e.getText().trim()),
  });

  const send = () => {
    const body = editor.getText({ blockSeparator: '\n' }).trim();
    if (body) onSend?.(body);
  };

  if (!editor) return null;

  return (
    <div className="reply-section animate-in">
      {/* Header */}
      <div className="reply-header-container">
        <div className="reply-type-selector">
          <div className="reply-icon-wrapper">
             <img src={replyIcon} alt="" className="reply-icon-main" />
          </div>
          <span className="reply-type-text">{recipientName ? `Replying to ${recipientName}` : 'Reply'}</span>
        </div>
      </div>

      {/* Recipients */}
      <div className="reply-recipients-row">
        <div className="recipients-left">
          <span className="recipients-label">To</span>
          <div className="recipient-chips">
            {recipientEmail && (
              <div className="recipient-chip">
                {recipientEmail}
                <button className="chip-close">
                  <img src={closeChipIcon} alt="Close" width="10" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="recipients-right">
          <span>Cc</span>
          <span>Bcc</span>
          <span className="edit-subject">Edit Subject</span>
        </div>
      </div>

      {/* Tiptap Editor Content */}
      <div className="reply-editor-wrapper">
        <EditorContent editor={editor} className="reply-tiptap-content" />
        {quotedEmail && (
          <>
            <button
              type="button"
              className={`btn-more-content reply-quoted-toggle${showQuoted ? ' is-open' : ''}`}
              aria-expanded={showQuoted}
              aria-label={showQuoted ? 'Hide the email you are replying to' : 'Show the email you are replying to'}
              onClick={() => setShowQuoted((o) => !o)}
            ><Icon name="hmore" size={14} /></button>
            {showQuoted && (
              <div className="convo-quote reply-quoted">
                <p className="convo-quote__meta">On {quotedEmail.time}, {quotedEmail.sender} wrote:</p>
                {quotedEmail.body.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Toolbars Container */}
      <div className="reply-footer-toolbars">
        {/* Top Formatting Bar */}
        <div className={`reply-formatting-bar ${showFormatting ? '' : 'hidden'}`}>
          <div className="format-group">
            {/* Font Select */}
            <div className="format-dropdown font-dropdown">
              <span>Serif</span>
              <img src={chevronDownIcon} alt="" width="12" />
            </div>
            {/* Size Select */}
            <div className="format-dropdown size-dropdown">
              <span>N</span>
              <img src={chevronDownIcon} alt="" width="12" />
            </div>
            {/* Color Select */}
            <div className="format-dropdown color-dropdown">
              <span>A</span>
              <img src={chevronDownIcon} alt="" width="12" />
            </div>
            
            <div className="format-divider-v"></div>

            <button 
              className={`format-btn ${editor.isActive('bold') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold size={16} />
            </button>
            <button 
              className={`format-btn ${editor.isActive('italic') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic size={16} />
            </button>
            <button 
              className={`format-btn ${editor.isActive('underline') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon size={16} />
            </button>
            <button 
              className={`format-btn ${editor.isActive('strike') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough size={16} />
            </button>

            <div className="format-divider-v"></div>

            <button 
              className={`format-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            >
              <AlignLeft size={16} />
            </button>
            <button 
              className={`format-btn ${editor.isActive('link') ? 'active' : ''}`}
              onClick={() => {
                const url = window.prompt('URL');
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
            >
              <LinkIcon size={16} />
            </button>
            <button className="format-btn">
              <img src={kebabIcon} alt="More" width="14" />
            </button>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="reply-action-bar">
          <div className="action-bar-left">
            <div className="action-icons-group">
              <button 
                className={`action-item-btn ${showFormatting ? 'active' : ''}`}
                onClick={() => setShowFormatting(!showFormatting)}
              >
                <img src={textIcon} alt="Text" width="16" />
              </button>
              <button className="action-item-btn">
                <img src={emojiIcon} alt="Emoji" width="16" />
              </button>
              <button className="action-item-btn">
                <img src={attachIcon} alt="Attach" width="16" />
              </button>
              <button className="action-item-btn">
                <img src={signatureIcon} alt="Signature" width="16" />
              </button>
              <button className="action-item-btn">
                <img src={templatesIcon} alt="Templates" width="16" />
              </button>
            </div>
          </div>
          <div className="action-bar-right">
            <div className="utility-icons-group">
              <button className="action-item-btn">
                <img src={shareIcon} alt="Share" width="18" />
              </button>
              <button className="action-item-btn">
                <img src={saveIcon} alt="Save" width="18" />
              </button>
              <button className="action-item-btn" onClick={onDiscard}>
                <img src={discardIcon} alt="Discard" width="18" />
              </button>
            </div>
            <button type="button" className={`reply-send-btn${isEmpty ? '' : ' ready'}`} disabled={isEmpty} onClick={send}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplySection;
